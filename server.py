from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from src.pbn_gen import PbnGen
import tempfile
import json
import traceback
import numpy as np
import cv2
from PIL import Image
from sklearn.cluster import KMeans

app = Flask(__name__)
CORS(app)

# Расширенная черно-белая палитра из 18 цветов
BW_PALETTE = [
    [0, 0, 0],        # Чистый черный: #000000
    [10, 10, 10],     # Очень темно-серый: #0A0A0A
    [26, 26, 26],     # Темный угольный: #1A1A1A
    [43, 43, 43],     # Темный графит: #2B2B2B
    [61, 61, 61],     # Серый шифер: #3D3D3D
    [79, 79, 79],     # Средне-темный серый: #4F4F4F
    [96, 96, 96],     # Серый бетон: #606060
    [112, 112, 112],  # Стальной серый: #707070
    [128, 128, 128],  # Серый (50%): #808080
    [144, 144, 144],  # Светло-серый металл: #909090
    [160, 160, 160],  # Серый алюминий: #A0A0A0
    [176, 176, 176],  # Серебристый: #B0B0B0
    [192, 192, 192],  # Светло-серый: #C0C0C0
    [208, 208, 208],  # Платиновый серый: #D0D0D0
    [224, 224, 224],  # Почти белый: #E0E0E0
    [240, 240, 240],  # Очень светлый серый: #F0F0F0
    [255, 255, 255]   # Чистый белый: #FFFFFF
]

# Сепийная палитра из 15 теплых коричневых оттенков
SEPIA_PALETTE = [
    [255, 251, 240],  # Почти белый с теплым отливом: #FFFBF0
    [248, 240, 224],  # Слоновая кость: #F8F0E0
    [240, 230, 210],  # Теплый кремовый: #F0E6D2
    [232, 216, 192],  # Песочный: #E8D8C0
    [224, 208, 176],  # Светлая сепия: #E0D0B0
    [212, 192, 160],  # Золотисто-бежевый: #D4C0A0
    [200, 176, 144],  # Натуральная сепия (база): #C8B090
    [188, 160, 128],  # Теплый хаки: #BCA080
    [176, 144, 112],  # Коричнево-желтый: #B09070
    [160, 128, 96],   # Глубокий "кофе с молоком": #A08060
    [140, 112, 80],   # Темная охра: #8C7050
    [120, 96, 64],    # Теплый умбра: #786040
    [100, 80, 48],    # Глубокий коричневый: #645030
    [80, 56, 32],     # Шоколадно-коричневый: #503820
    [60, 40, 16]      # Почти черный с сепийным отливом: #3C2810
]

# Шаблоны цифр 3x5 (0 — пусто, 1 — чёрный пиксель)
DIGIT_TEMPLATES = {
    '0': [
        [1,1,1],
        [1,0,1],
        [1,0,1],
        [1,0,1],
        [1,1,1],
    ],
    '1': [
        [0,1,0],
        [1,1,0],
        [0,1,0],
        [0,1,0],
        [1,1,1],
    ],
    '2': [
        [1,1,1],
        [0,0,1],
        [1,1,1],
        [1,0,0],
        [1,1,1],
    ],
    '3': [
        [1,1,1],
        [0,0,1],
        [0,1,1],
        [0,0,1],
        [1,1,1],
    ],
    '4': [
        [1,0,1],
        [1,0,1],
        [1,1,1],
        [0,0,1],
        [0,0,1],
    ],
    '5': [
        [1,1,1],
        [1,0,0],
        [1,1,1],
        [0,0,1],
        [1,1,1],
    ],
    '6': [
        [1,1,1],
        [1,0,0],
        [1,1,1],
        [1,0,1],
        [1,1,1],
    ],
    '7': [
        [1,1,1],
        [0,0,1],
        [0,1,0],
        [1,0,0],
        [1,0,0],
    ],
    '8': [
        [1,1,1],
        [1,0,1],
        [1,1,1],
        [1,0,1],
        [1,1,1],
    ],
    '9': [
        [1,1,1],
        [1,0,1],
        [1,1,1],
        [0,0,1],
        [1,1,1],
    ],
}

# Функция для получения маски цифры (3x5 на каждую цифру, по центру)
def get_digit_mask(number, grid_w=10, grid_h=10):
    number_str = str(number)
    digit_w = 3
    digit_h = 5
    n_digits = len(number_str)
    px = grid_w
    py = grid_h
    total_w = n_digits * digit_w + (n_digits-1)  # 1px между цифрами
    start_x = (px - total_w + 1) // 2
    start_y = (py - digit_h + 1) // 2
    mask = [[0 for _ in range(grid_w)] for _ in range(grid_h)]
    for idx, digit in enumerate(number_str):
        template = DIGIT_TEMPLATES.get(digit, DIGIT_TEMPLATES['0'])
        dx = start_x + idx * (digit_w + 1)
        for row in range(digit_h):
            for col in range(digit_w):
                if template[row][col]:
                    x = dx + col
                    y = start_y + row
                    if 0 <= x < grid_w and 0 <= y < grid_h:
                        mask[y][x] = 1
    return mask

@app.route('/api/convert', methods=['POST'])
def convert_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Проверка размера файла (до 5 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    if file_length > 5 * 1024 * 1024:
        return jsonify({'error': 'Размер файла превышает 5 МБ'}), 400

    temp_dir = None
    try:
        # Create temporary directory for processing
        temp_dir = tempfile.mkdtemp()
        print("Created temporary directory:", temp_dir)
        
        # Save uploaded file
        input_path = os.path.join(temp_dir, 'input.jpg')
        file.save(input_path)
        print("Saved input file to:", input_path)

        # Проверка разрешения изображения (до 2000x2000)
        print("Checking image dimensions...")
        with Image.open(input_path) as img:
            width, height = img.size
            print(f"Image dimensions: {width}x{height}")
            
            # Приводим к соотношению 800x1000 (0.8)
            target_ratio = 800 / 1000
            img_ratio = width / height
            if img_ratio > target_ratio:
                # слишком широкое, обрезаем по ширине
                new_width = int(height * target_ratio)
                left = (width - new_width) // 2
                img = img.crop((left, 0, left + new_width, height))
            elif img_ratio < target_ratio:
                # слишком высокое, обрезаем по высоте
                new_height = int(width / target_ratio)
                top = (height - new_height) // 2
                img = img.crop((0, top, width, top + new_height))
            # Масштабируем до 800x1000
            img = img.resize((800, 1000), Image.Resampling.LANCZOS)
            img.save(input_path, 'JPEG', quality=95)
            print(f"Image scaled and saved as 800x1000")
        
        # Process image
        print("Initializing PbnGen...")
        pbn = PbnGen(input_path)
        print("Setting final PBN...")
        pbn.set_final_pbn()
        
        # Generate output files
        svg_path = os.path.join(temp_dir, 'output.svg')
        palette_path = os.path.join(temp_dir, 'palette.json')
        print("Generating SVG and palette...")
        pbn.output_to_svg(svg_path, palette_path)
        
        # Read the generated files
        print("Reading generated files...")
        with open(svg_path, 'r') as f:
            svg_content = f.read()
        with open(palette_path, 'r') as f:
            palette_content = json.load(f)
            
        # Преобразуем цвета в палитре в обычные числа
        print("Processing palette colors...")
        processed_palette = []
        for item in palette_content:
            # Преобразуем строку '(np.uint8(r), np.uint8(g), np.uint8(b))' в список чисел
            color_str = item['color'].strip('()')
            color_values = []
            for x in color_str.split(','):
                # Извлекаем число из np.uint8(x)
                num = x.strip().replace('np.uint8(', '').replace(')', '')
                color_values.append(int(num))
            
            processed_item = {
                'color': color_values,
                'shapes': item['shapes']
            }
            processed_palette.append(processed_item)
        
        print("Successfully processed image")
        return jsonify({
            'svg': svg_content,
            'palette': processed_palette
        })
    except Exception as e:
        print("Error processing image:")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Error generating paint by number, try again later or try a smaller image size',
            'details': str(e)
        }), 500
    finally:
        # Очищаем временную директорию
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                print(f"Cleaned up temporary directory: {temp_dir}")
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up temporary directory {temp_dir}: {cleanup_error}")

@app.route('/api/convert-pixels', methods=['POST'])
def convert_image_pixels():
    print("=== Starting convert_image_pixels ===")
    if 'image' not in request.files:
        print("ERROR: No image in request.files")
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    print(f"File received: {file.filename}")
    if file.filename == '':
        print("ERROR: Empty filename")
        return jsonify({'error': 'No selected file'}), 400

    # Проверка размера файла (до 5 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    print(f"File size: {file_length} bytes")
    if file_length > 5 * 1024 * 1024:
        print("ERROR: File too large")
        return jsonify({'error': 'Размер файла превышает 5 МБ'}), 400

    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        print("Created temporary directory:", temp_dir)
        input_path = os.path.join(temp_dir, 'input.jpg')
        file.save(input_path)
        print("Saved input file to:", input_path)

        # Проверка разрешения изображения (до 2000x2000)
        print("Checking image dimensions...")
        with Image.open(input_path) as img:
            width, height = img.size
            print(f"Image dimensions: {width}x{height}")
            
            # Приводим к соотношению 800x1000 (0.8)
            target_ratio = 800 / 1000
            img_ratio = width / height
            if img_ratio > target_ratio:
                # слишком широкое, обрезаем по ширине
                new_width = int(height * target_ratio)
                left = (width - new_width) // 2
                img = img.crop((left, 0, left + new_width, height))
            elif img_ratio < target_ratio:
                # слишком высокое, обрезаем по высоте
                new_height = int(width / target_ratio)
                top = (height - new_height) // 2
                img = img.crop((0, top, width, top + new_height))
            # Масштабируем до 800x1000
            img = img.resize((800, 1000), Image.Resampling.LANCZOS)
            img.save(input_path, 'JPEG', quality=95)
            print(f"Image scaled and saved as 800x1000")
        
        # Фиксированное количество пикселей и размер холста под 8x10
        num_pixels_x = 128  # 8 больших квадратов * 16 пикселей
        num_pixels_y = 160  # 10 больших квадратов * 16 пикселей
        canvas_width = 800
        canvas_height = 1000
        max_colors = 15  # Максимальное количество цветов

        # Открываем изображение
        print("Reading image with OpenCV...")
        img = cv2.imread(input_path)
        if img is None:
            print("ERROR: OpenCV could not read image")
            return jsonify({'error': 'Не удалось прочитать изображение'}), 400
            
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w, _ = img.shape
        print(f"Original image size: {w}x{h}")

        # Изменяем размер изображения до фиксированного количества пикселей
        img = cv2.resize(img, (num_pixels_x, num_pixels_y), interpolation=cv2.INTER_AREA)
        h, w, _ = img.shape
        print(f"Resized to {num_pixels_x}x{num_pixels_y} pixels")

        # Квантование цветов с помощью K-means
        print("Starting K-means quantization...")
        pixels = img.reshape(-1, 3)  # Преобразуем в 2D массив
        kmeans = KMeans(n_clusters=max_colors, random_state=42, n_init=10)
        labels = kmeans.fit_predict(pixels)
        quantized_img = kmeans.cluster_centers_[labels].reshape(h, w, 3).astype(np.uint8)
        
        print(f"Quantized to {max_colors} colors")

        # Рассчитываем размер каждого пикселя на холсте
        pixel_width = canvas_width / num_pixels_x
        pixel_height = canvas_height / num_pixels_y

        # Разбиваем на пиксели
        print("Generating SVG elements...")
        svg_elements = []
        grid_cols = 8
        grid_rows = 16
        cell_w = 800 / grid_cols
        cell_h = 1000 / grid_rows
        px_w = cell_w / 16
        px_h = cell_h / 10
        palette = []
        color_map = {}
        color_idx = 1
        # --- 1. Рисуем картину (цветные пиксели) ---
        for y in range(num_pixels_y):
            for x in range(num_pixels_x):
                pixel_color = tuple(int(v) for v in quantized_img[y, x])
                if pixel_color not in color_map:
                    color_map[pixel_color] = int(color_idx)
                    palette.append({'color': [int(c) for c in pixel_color], 'number': int(color_idx)})
                    color_idx += 1
                number = color_map[pixel_color]
                canvas_x = x * pixel_width
                canvas_y = y * pixel_height
                rect = f'<rect x="{canvas_x}" y="{canvas_y}" width="{pixel_width}" height="{pixel_height}" fill="white" stroke="black" stroke-width="0.5" data-color="rgb({pixel_color[0]},{pixel_color[1]},{pixel_color[2]})" data-number="{number}"/>'
                svg_elements.append(rect)
        # --- 2. Поверх добавляем пиксельные номера ---
        digit_color = 'rgb(136,136,136)'
        for cell_idx in range(grid_cols * grid_rows):
            number = cell_idx + 1
            col = cell_idx % grid_cols
            row = cell_idx // grid_cols
            cell_x = col * cell_w
            cell_y = row * cell_h
            mask = get_digit_mask(number, grid_w=16, grid_h=10)
            for py_idx in range(10):
                for px_idx in range(16):
                    if mask[py_idx][px_idx]:
                        rx = cell_x + px_idx * px_w
                        ry = cell_y + py_idx * px_h
                        rect = f'<rect x="{rx}" y="{ry}" width="{px_w}" height="{px_h}" fill="{digit_color}" opacity="0.4" stroke="none" data-digit-pixel="1" data-digit-label="1" style="pointer-events:none"/>'
                        svg_elements.append(rect)
        svg_content = f'<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' + ''.join(svg_elements) + '</svg>'

        print("Successfully processed pixel image")
        return jsonify({
            'svg': svg_content,
            'palette': palette
        })
    except Exception as e:
        print("Error processing pixel image:")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Error generating pixel paint by number',
            'details': str(e)
        }), 500
    finally:
        # Очищаем временную директорию
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                print(f"Cleaned up temporary directory: {temp_dir}")
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up temporary directory {temp_dir}: {cleanup_error}")

@app.route('/api/convert-pixels-bw', methods=['POST'])
def convert_image_pixels_bw():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Проверка размера файла (до 5 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    if file_length > 5 * 1024 * 1024:
        return jsonify({'error': 'Размер файла превышает 5 МБ'}), 400

    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        print("Created temporary directory:", temp_dir)
        input_path = os.path.join(temp_dir, 'input.jpg')
        file.save(input_path)
        print("Saved input file to:", input_path)

        # Проверка разрешения изображения (до 2000x2000)
        print("Checking image dimensions...")
        with Image.open(input_path) as img:
            width, height = img.size
            print(f"Image dimensions: {width}x{height}")
            
            # Приводим к соотношению 800x1000 (0.8)
            target_ratio = 800 / 1000
            img_ratio = width / height
            if img_ratio > target_ratio:
                # слишком широкое, обрезаем по ширине
                new_width = int(height * target_ratio)
                left = (width - new_width) // 2
                img = img.crop((left, 0, left + new_width, height))
            elif img_ratio < target_ratio:
                # слишком высокое, обрезаем по высоте
                new_height = int(width / target_ratio)
                top = (height - new_height) // 2
                img = img.crop((0, top, width, top + new_height))
            # Масштабируем до 800x1000
            img = img.resize((800, 1000), Image.Resampling.LANCZOS)
            img.save(input_path, 'JPEG', quality=95)
            print(f"Image scaled and saved as 800x1000")
        
        # Фиксированное количество пикселей
        num_pixels_x = 80
        num_pixels_y = 80
        canvas_width = 800
        canvas_height = 1000

        # Открываем изображение
        img = cv2.imread(input_path)
        if img is None:
            return jsonify({'error': 'Не удалось прочитать изображение'}), 400
            
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w, _ = img.shape
        print(f"Original image size: {w}x{h}")

        # Изменяем размер изображения до фиксированного количества пикселей
        img = cv2.resize(img, (num_pixels_x, num_pixels_y), interpolation=cv2.INTER_AREA)
        h, w, _ = img.shape
        print(f"Resized to {num_pixels_x}x{num_pixels_y} pixels")

        # Конвертируем в оттенки серого
        gray_img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        
        # Квантование в 18 уровней серого
        quantized_gray = np.zeros_like(gray_img)
        for i in range(18):
            lower = i * 15  # 255 / 17 ≈ 15 (17 интервалов между 18 цветами)
            upper = (i + 1) * 15
            if i == 17:  # Последний уровень
                upper = 256
            mask = (gray_img >= lower) & (gray_img < upper)
            quantized_gray[mask] = i
        
        print("Quantized to 18 gray levels")

        # Рассчитываем размер каждого пикселя на холсте
        pixel_width = canvas_width / num_pixels_x
        pixel_height = canvas_height / num_pixels_y

        # Разбиваем на пиксели
        svg_elements = []
        grid_cols = 8
        grid_rows = 8
        cell_w = 800 / grid_cols
        cell_h = 1000 / grid_rows
        px_w = cell_w / 10
        px_h = cell_h / 10
        palette = []
        color_map = {}
        color_idx = 1
        for y in range(num_pixels_y):
            for x in range(num_pixels_x):
                gray_level = int(quantized_gray[y, x])
                pixel_color = BW_PALETTE[gray_level]
                if tuple(pixel_color) not in color_map:
                    color_map[tuple(pixel_color)] = int(color_idx)
                    palette.append({'color': pixel_color, 'number': int(color_idx)})
                    color_idx += 1
                number = color_map[tuple(pixel_color)]
                canvas_x = x * pixel_width
                canvas_y = y * pixel_height
                rect = f'<rect x="{canvas_x}" y="{canvas_y}" width="{pixel_width}" height="{pixel_height}" fill="white" stroke="black" stroke-width="0.5" data-color="rgb({pixel_color[0]},{pixel_color[1]},{pixel_color[2]})" data-number="{number}"/>'
                svg_elements.append(rect)
        digit_color = 'rgb(136,136,136)'
        for cell_idx in range(grid_cols * grid_rows):
            number = cell_idx + 1
            col = cell_idx % grid_cols
            row = cell_idx // grid_cols
            cell_x = col * cell_w
            cell_y = row * cell_h
            mask = get_digit_mask(number, grid_w=10, grid_h=10)
            for py_idx in range(10):
                for px_idx in range(10):
                    if mask[py_idx][px_idx]:
                        rx = cell_x + px_idx * px_w
                        ry = cell_y + py_idx * px_h
                        rect = f'<rect x="{rx}" y="{ry}" width="{px_w}" height="{px_h}" fill="{digit_color}" opacity="0.4" stroke="none" data-digit-pixel="1" data-digit-label="1" style="pointer-events:none"/>'
                        svg_elements.append(rect)
        svg_content = f'<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' + ''.join(svg_elements) + '</svg>'

        print("Successfully processed black and white pixel image")
        return jsonify({
            'svg': svg_content,
            'palette': palette
        })
    except Exception as e:
        print("Error processing black and white pixel image:")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Error generating black and white pixel paint by number',
            'details': str(e)
        }), 500
    finally:
        # Очищаем временную директорию
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                print(f"Cleaned up temporary directory: {temp_dir}")
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up temporary directory {temp_dir}: {cleanup_error}")

@app.route('/api/convert-pixels-sepia', methods=['POST'])
def convert_image_pixels_sepia():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Проверка размера файла (до 5 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    if file_length > 5 * 1024 * 1024:
        return jsonify({'error': 'Размер файла превышает 5 МБ'}), 400

    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp()
        print("Created temporary directory:", temp_dir)
        input_path = os.path.join(temp_dir, 'input.jpg')
        file.save(input_path)
        print("Saved input file to:", input_path)

        # Проверка разрешения изображения (до 2000x2000)
        print("Checking image dimensions...")
        with Image.open(input_path) as img:
            width, height = img.size
            print(f"Image dimensions: {width}x{height}")
            
            # Приводим к соотношению 800x1000 (0.8)
            target_ratio = 800 / 1000
            img_ratio = width / height
            if img_ratio > target_ratio:
                # слишком широкое, обрезаем по ширине
                new_width = int(height * target_ratio)
                left = (width - new_width) // 2
                img = img.crop((left, 0, left + new_width, height))
            elif img_ratio < target_ratio:
                # слишком высокое, обрезаем по высоте
                new_height = int(width / target_ratio)
                top = (height - new_height) // 2
                img = img.crop((0, top, width, top + new_height))
            # Масштабируем до 800x1000
            img = img.resize((800, 1000), Image.Resampling.LANCZOS)
            img.save(input_path, 'JPEG', quality=95)
            print(f"Image scaled and saved as 800x1000")
        
        # Фиксированное количество пикселей
        num_pixels_x = 80
        num_pixels_y = 80
        canvas_width = 800
        canvas_height = 1000

        # Открываем изображение
        img = cv2.imread(input_path)
        if img is None:
            return jsonify({'error': 'Не удалось прочитать изображение'}), 400
            
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w, _ = img.shape
        print(f"Original image size: {w}x{h}")

        # Изменяем размер изображения до фиксированного количества пикселей
        img = cv2.resize(img, (num_pixels_x, num_pixels_y), interpolation=cv2.INTER_AREA)
        h, w, _ = img.shape
        print(f"Resized to {num_pixels_x}x{num_pixels_y} pixels")

        # Конвертируем в оттенки серого
        gray_img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        
        # Квантование в 15 уровней серого для сепийной палитры
        quantized_gray = np.zeros_like(gray_img)
        for i in range(15):
            lower = i * 17  # 255 / 15 ≈ 17
            upper = (i + 1) * 17
            if i == 14:  # Последний уровень
                upper = 256
            mask = (gray_img >= lower) & (gray_img < upper)
            quantized_gray[mask] = i
        
        print("Quantized to 15 gray levels for sepia")

        # Рассчитываем размер каждого пикселя на холсте
        pixel_width = canvas_width / num_pixels_x
        pixel_height = canvas_height / num_pixels_y

        # Разбиваем на пиксели
        svg_elements = []
        grid_cols = 8
        grid_rows = 8
        cell_w = 800 / grid_cols
        cell_h = 1000 / grid_rows
        px_w = cell_w / 10
        px_h = cell_h / 10
        palette = []
        color_map = {}
        color_idx = 1
        for y in range(num_pixels_y):
            for x in range(num_pixels_x):
                gray_level = int(quantized_gray[y, x])
                pixel_color = SEPIA_PALETTE[gray_level]
                if tuple(pixel_color) not in color_map:
                    color_map[tuple(pixel_color)] = int(color_idx)
                    palette.append({'color': pixel_color, 'number': int(color_idx)})
                    color_idx += 1
                number = color_map[tuple(pixel_color)]
                canvas_x = x * pixel_width
                canvas_y = y * pixel_height
                rect = f'<rect x="{canvas_x}" y="{canvas_y}" width="{pixel_width}" height="{pixel_height}" fill="white" stroke="black" stroke-width="0.5" data-color="rgb({pixel_color[0]},{pixel_color[1]},{pixel_color[2]})" data-number="{number}"/>'
                svg_elements.append(rect)
        digit_color = 'rgb(136,136,136)'
        for cell_idx in range(grid_cols * grid_rows):
            number = cell_idx + 1
            col = cell_idx % grid_cols
            row = cell_idx // grid_cols
            cell_x = col * cell_w
            cell_y = row * cell_h
            mask = get_digit_mask(number, grid_w=10, grid_h=10)
            for py_idx in range(10):
                for px_idx in range(10):
                    if mask[py_idx][px_idx]:
                        rx = cell_x + px_idx * px_w
                        ry = cell_y + py_idx * px_h
                        rect = f'<rect x="{rx}" y="{ry}" width="{px_w}" height="{px_h}" fill="{digit_color}" opacity="0.4" stroke="none" data-digit-pixel="1" data-digit-label="1" style="pointer-events:none"/>'
                        svg_elements.append(rect)
        svg_content = f'<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' + ''.join(svg_elements) + '</svg>'

        print("Successfully processed sepia pixel image")
        return jsonify({
            'svg': svg_content,
            'palette': palette
        })
    except Exception as e:
        print("Error processing sepia pixel image:")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Error generating sepia pixel paint by number',
            'details': str(e)
        }), 500
    finally:
        # Очищаем временную директорию
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                print(f"Cleaned up temporary directory: {temp_dir}")
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up temporary directory {temp_dir}: {cleanup_error}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 