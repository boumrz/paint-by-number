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
import datetime

# Импортируем новые модули
from data.access_codes_manager import AccessCodesManager
from excel_generator.excel_generator import ExcelGenerator

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

# --- Функция для маски с переносом третьей цифры ---
def get_digit_mask_split3(number, grid_w=10, grid_h=16):
    number_str = str(number)
    assert len(number_str) == 3
    digit_w = 3
    digit_h = 5
    px = grid_w
    py = grid_h
    mask = [[0 for _ in range(grid_w)] for _ in range(grid_h)]
    # Верхняя строка: первые две цифры
    total_w_top = 2 * digit_w + 1  # 1px между цифрами
    start_x_top = (px - total_w_top + 1) // 2
    start_y_top = (py // 2) - digit_h
    for idx in range(2):
        template = DIGIT_TEMPLATES.get(number_str[idx], DIGIT_TEMPLATES['0'])
        dx = start_x_top + idx * (digit_w + 1)
        for row in range(digit_h):
            for col in range(digit_w):
                if template[row][col]:
                    x = dx + col
                    y = start_y_top + row
                    if 0 <= x < grid_w and 0 <= y < grid_h:
                        mask[y][x] = 1
    # Нижняя строка: третья цифра
    template = DIGIT_TEMPLATES.get(number_str[2], DIGIT_TEMPLATES['0'])
    start_x_bot = (px - digit_w + 1) // 2
    start_y_bot = (py // 2) + 1
    for row in range(digit_h):
        for col in range(digit_w):
            if template[row][col]:
                x = start_x_bot + col
                y = start_y_bot + row
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

    # Проверка размера файла (до 30 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    if file_length > 30 * 1024 * 1024:
        return jsonify({'error': 'Размер файла превышает 30 МБ'}), 400

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

    # Проверка размера файла (до 30 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    print(f"File size: {file_length} bytes")
    if file_length > 30 * 1024 * 1024:
        print("ERROR: File too large")
        return jsonify({'error': 'Размер файла превышает 30 МБ'}), 400

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

    # Проверка размера файла (до 30 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    if file_length > 30 * 1024 * 1024:
        return jsonify({'error': 'Размер файла превышает 30 МБ'}), 400

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
        num_pixels_x = 128
        num_pixels_y = 160
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
        
        # Квантование в 17 уровней серого
        quantized_gray = np.zeros_like(gray_img)
        for i in range(17):
            lower = i * 15  # 255 / 17 ≈ 15 (17 интервалов между 17 цветами)
            upper = (i + 1) * 15
            if i == 16:  # Последний уровень
                upper = 256
            mask = (gray_img >= lower) & (gray_img < upper)
            quantized_gray[mask] = i
        
        print("Quantized to 17 gray levels")

        # Рассчитываем размер каждого пикселя на холсте
        pixel_width = canvas_width / num_pixels_x
        pixel_height = canvas_height / num_pixels_y

        # Разбиваем на пиксели
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
            mask = get_digit_mask(number, grid_w=16, grid_h=10)
            for py_idx in range(10):
                for px_idx in range(16):
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

    # Проверка размера файла (до 30 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    if file_length > 30 * 1024 * 1024:
        return jsonify({'error': 'Размер файла превышает 30 МБ'}), 400

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
        num_pixels_x = 128
        num_pixels_y = 160
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
        grid_rows = 16
        cell_w = 800 / grid_cols
        cell_h = 1000 / grid_rows
        px_w = cell_w / 16
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
            mask = get_digit_mask(number, grid_w=16, grid_h=10)
            for py_idx in range(10):
                for px_idx in range(16):
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

@app.route('/api/convert-pixels-horizontal', methods=['POST'])
def convert_image_pixels_horizontal():
    print("=== Starting convert_image_pixels_horizontal ===")
    if 'image' not in request.files:
        print("ERROR: No image in request.files")
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    print(f"File received: {file.filename}")
    if file.filename == '':
        print("ERROR: Empty filename")
        return jsonify({'error': 'No selected file'}), 400

    # Проверка размера файла (до 30 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    print(f"File size: {file_length} bytes")
    if file_length > 30 * 1024 * 1024:
        print("ERROR: File too large")
        return jsonify({'error': 'Размер файла превышает 30 МБ'}), 400

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
            
            # Приводим к соотношению 1000x800 (1.25)
            target_ratio = 1000 / 800
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
            # Масштабируем до 1000x800
            img = img.resize((1000, 800), Image.Resampling.LANCZOS)
            img.save(input_path, 'JPEG', quality=95)
            print(f"Image scaled and saved as 1000x800")
        
        # Фиксированное количество пикселей и размер холста под 16x8
        num_pixels_x = 160  # 16 больших квадратов * 10 пикселей
        num_pixels_y = 128  # 8 больших квадратов * 16 пикселей
        canvas_width = 1000
        canvas_height = 800
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
        grid_cols = 16
        grid_rows = 8
        cell_w = 1000 / grid_cols
        cell_h = 800 / grid_rows
        px_w = cell_w / 10
        px_h = cell_h / 16
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
        # --- 2. Поверх добавляем номера больших прямоугольников пиксельной маской ---
        digit_color = 'rgb(136,136,136)'
        for cell_idx in range(grid_cols * grid_rows):
            number = cell_idx + 1
            col = cell_idx % grid_cols
            row = cell_idx // grid_cols
            cell_x = col * cell_w
            cell_y = row * cell_h
            num_str = str(number)
            if len(num_str) == 3:
                mask = get_digit_mask_split3(number, grid_w=10, grid_h=16)
            else:
                mask = get_digit_mask(number, grid_w=10, grid_h=16)
            for py_idx in range(16):
                for px_idx in range(10):
                    if mask[py_idx][px_idx]:
                        rx = cell_x + px_idx * px_w
                        ry = cell_y + py_idx * px_h
                        rect = f'<rect x="{rx}" y="{ry}" width="{px_w}" height="{px_h}" fill="{digit_color}" opacity="0.4" stroke="none" data-digit-pixel="1" data-digit-label="1" style="pointer-events:none"/>'
                        svg_elements.append(rect)
        svg_content = f'<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' + ''.join(svg_elements) + '</svg>'

        print("Successfully processed horizontal pixel image")
        return jsonify({
            'svg': svg_content,
            'palette': palette
        })
    except Exception as e:
        print("Error processing horizontal pixel image:")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Error generating horizontal pixel paint by number',
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

@app.route('/api/convert-pixels-horizontal-bw', methods=['POST'])
def convert_image_pixels_horizontal_bw():
    print("=== Starting convert_image_pixels_horizontal_bw ===")
    if 'image' not in request.files:
        print("ERROR: No image in request.files")
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    print(f"File received: {file.filename}")
    if file.filename == '':
        print("ERROR: Empty filename")
        return jsonify({'error': 'No selected file'}), 400

    # Проверка размера файла (до 30 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    print(f"File size: {file_length} bytes")
    if file_length > 30 * 1024 * 1024:
        print("ERROR: File too large")
        return jsonify({'error': 'Размер файла превышает 30 МБ'}), 400

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
            # Поворот до обрезки и ресайза
            if height > width:
                print("Rotating vertical image 90 degrees counterclockwise")
                img = img.rotate(90, expand=True)
                width, height = height, width
                print(f"After rotation: {width}x{height}")
            # Приводим к соотношению 1000x800 (1.25)
            target_ratio = 1000 / 800
            img_ratio = width / height
            if img_ratio > target_ratio:
                new_width = int(height * target_ratio)
                left = (width - new_width) // 2
                img = img.crop((left, 0, left + new_width, height))
            elif img_ratio < target_ratio:
                new_height = int(width / target_ratio)
                top = (height - new_height) // 2
                img = img.crop((0, top, width, top + new_height))
            img = img.resize((1000, 800), Image.Resampling.LANCZOS)
            img.save(input_path, 'JPEG', quality=95)
            print(f"Image scaled and saved as 1000x800")
        
        num_pixels_x = 160
        num_pixels_y = 128
        canvas_width = 1000
        canvas_height = 800

        # Открываем изображение
        img = cv2.imread(input_path)
        if img is None:
            print("ERROR: OpenCV could not read image")
            return jsonify({'error': 'Не удалось прочитать изображение'}), 400
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w, _ = img.shape
        print(f"Original image size: {w}x{h}")
        
        # Проверяем, нужно ли повернуть изображение (если высота больше ширины)
        if h > w:
            print("Rotating vertical image 90 degrees counterclockwise")
            img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
            h, w = w, h  # Меняем местами размеры
            print(f"After rotation: {w}x{h}")
        
        img = cv2.resize(img, (num_pixels_x, num_pixels_y), interpolation=cv2.INTER_AREA)
        h, w, _ = img.shape
        print(f"Resized to {num_pixels_x}x{num_pixels_y} pixels")

        # Конвертируем в оттенки серого
        gray_img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        # Квантование в 17 уровней серого
        quantized_gray = np.zeros_like(gray_img)
        for i in range(17):
            lower = i * 15
            upper = (i + 1) * 15
            if i == 16:
                upper = 256
            mask = (gray_img >= lower) & (gray_img < upper)
            quantized_gray[mask] = i
        print("Quantized to 17 gray levels")

        pixel_width = canvas_width / num_pixels_x
        pixel_height = canvas_height / num_pixels_y
        svg_elements = []
        grid_cols = 16
        grid_rows = 8
        cell_w = 1000 / grid_cols
        cell_h = 800 / grid_rows
        px_w = cell_w / 10
        px_h = cell_h / 16
        palette = []
        color_map = {}
        color_idx = 1
        for y in range(num_pixels_y):
            for x in range(num_pixels_x):
                gray_level = quantized_gray[y, x]
                color = BW_PALETTE[gray_level]
                pixel_color = tuple(color)
                if pixel_color not in color_map:
                    color_map[pixel_color] = int(color_idx)
                    palette.append({'color': [int(c) for c in pixel_color], 'number': int(color_idx)})
                    color_idx += 1
                number = color_map[pixel_color]
                canvas_x = x * pixel_width
                canvas_y = y * pixel_height
                rect = f'<rect x="{canvas_x}" y="{canvas_y}" width="{pixel_width}" height="{pixel_height}" fill="white" stroke="black" stroke-width="0.5" data-color="rgb({pixel_color[0]},{pixel_color[1]},{pixel_color[2]})" data-number="{number}"/>'
                svg_elements.append(rect)
        # --- 2. Поверх добавляем номера больших прямоугольников пиксельной маской ---
        digit_color = 'rgb(136,136,136)'
        for cell_idx in range(grid_cols * grid_rows):
            number = cell_idx + 1
            col = cell_idx % grid_cols
            row = cell_idx // grid_cols
            cell_x = col * cell_w
            cell_y = row * cell_h
            num_str = str(number)
            if len(num_str) == 3:
                mask = get_digit_mask_split3(number, grid_w=10, grid_h=16)
            else:
                mask = get_digit_mask(number, grid_w=10, grid_h=16)
            for py_idx in range(16):
                for px_idx in range(10):
                    if mask[py_idx][px_idx]:
                        rx = cell_x + px_idx * px_w
                        ry = cell_y + py_idx * px_h
                        rect = f'<rect x="{rx}" y="{ry}" width="{px_w}" height="{px_h}" fill="{digit_color}" opacity="0.4" stroke="none" data-digit-pixel="1" data-digit-label="1" style="pointer-events:none"/>'
                        svg_elements.append(rect)
        svg_content = f'<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' + ''.join(svg_elements) + '</svg>'
        print("Successfully processed horizontal bw pixel image")
        return jsonify({
            'svg': svg_content,
            'palette': palette
        })
    except Exception as e:
        print("Error processing horizontal bw pixel image:")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Error generating horizontal bw pixel paint by number',
            'details': str(e)
        }), 500
    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                print(f"Cleaned up temporary directory: {temp_dir}")
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up temporary directory {temp_dir}: {cleanup_error}")

@app.route('/api/convert-pixels-horizontal-sepia', methods=['POST'])
def convert_image_pixels_horizontal_sepia():
    print("=== Starting convert_image_pixels_horizontal_sepia ===")
    if 'image' not in request.files:
        print("ERROR: No image in request.files")
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    print(f"File received: {file.filename}")
    if file.filename == '':
        print("ERROR: Empty filename")
        return jsonify({'error': 'No selected file'}), 400

    # Проверка размера файла (до 30 МБ)
    file.seek(0, os.SEEK_END)
    file_length = file.tell()
    file.seek(0)
    print(f"File size: {file_length} bytes")
    if file_length > 30 * 1024 * 1024:
        print("ERROR: File too large")
        return jsonify({'error': 'Размер файла превышает 30 МБ'}), 400

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
            
            # Приводим к соотношению 1000x800 (1.25)
            target_ratio = 1000 / 800
            img_ratio = width / height
            if img_ratio > target_ratio:
                new_width = int(height * target_ratio)
                left = (width - new_width) // 2
                img = img.crop((left, 0, left + new_width, height))
            elif img_ratio < target_ratio:
                new_height = int(width / target_ratio)
                top = (height - new_height) // 2
                img = img.crop((0, top, width, top + new_height))
            img = img.resize((1000, 800), Image.Resampling.LANCZOS)
            img.save(input_path, 'JPEG', quality=95)
            print(f"Image scaled and saved as 1000x800")
        
        num_pixels_x = 160
        num_pixels_y = 128
        canvas_width = 1000
        canvas_height = 800

        # Открываем изображение
        img = cv2.imread(input_path)
        if img is None:
            print("ERROR: OpenCV could not read image")
            return jsonify({'error': 'Не удалось прочитать изображение'}), 400
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w, _ = img.shape
        print(f"Original image size: {w}x{h}")
        
        # Проверяем, нужно ли повернуть изображение (если высота больше ширины)
        if h > w:
            print("Rotating vertical image 90 degrees counterclockwise")
            img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
            h, w = w, h  # Меняем местами размеры
            print(f"After rotation: {w}x{h}")
        
        img = cv2.resize(img, (num_pixels_x, num_pixels_y), interpolation=cv2.INTER_AREA)
        h, w, _ = img.shape
        print(f"Resized to {num_pixels_x}x{num_pixels_y} pixels")

        # Конвертируем в оттенки серого
        gray_img = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        # Квантование в 15 уровней серого для сепии
        quantized_gray = np.zeros_like(gray_img)
        for i in range(15):
            lower = i * 17
            upper = (i + 1) * 17
            if i == 14:
                upper = 256
            mask = (gray_img >= lower) & (gray_img < upper)
            quantized_gray[mask] = i
        print("Quantized to 15 gray levels for sepia")

        pixel_width = canvas_width / num_pixels_x
        pixel_height = canvas_height / num_pixels_y
        svg_elements = []
        grid_cols = 16
        grid_rows = 8
        cell_w = 1000 / grid_cols
        cell_h = 800 / grid_rows
        px_w = cell_w / 10
        px_h = cell_h / 16
        palette = []
        color_map = {}
        color_idx = 1
        for y in range(num_pixels_y):
            for x in range(num_pixels_x):
                gray_level = quantized_gray[y, x]
                color = SEPIA_PALETTE[gray_level]
                pixel_color = tuple(color)
                if pixel_color not in color_map:
                    color_map[pixel_color] = int(color_idx)
                    palette.append({'color': [int(c) for c in pixel_color], 'number': int(color_idx)})
                    color_idx += 1
                number = color_map[pixel_color]
                canvas_x = x * pixel_width
                canvas_y = y * pixel_height
                rect = f'<rect x="{canvas_x}" y="{canvas_y}" width="{pixel_width}" height="{pixel_height}" fill="white" stroke="black" stroke-width="0.5" data-color="rgb({pixel_color[0]},{pixel_color[1]},{pixel_color[2]})" data-number="{number}"/>'
                svg_elements.append(rect)
        # --- 2. Поверх добавляем номера больших прямоугольников пиксельной маской ---
        digit_color = 'rgb(136,136,136)'
        for cell_idx in range(grid_cols * grid_rows):
            number = cell_idx + 1
            col = cell_idx % grid_cols
            row = cell_idx // grid_cols
            cell_x = col * cell_w
            cell_y = row * cell_h
            num_str = str(number)
            if len(num_str) == 3:
                mask = get_digit_mask_split3(number, grid_w=10, grid_h=16)
            else:
                mask = get_digit_mask(number, grid_w=10, grid_h=16)
            for py_idx in range(16):
                for px_idx in range(10):
                    if mask[py_idx][px_idx]:
                        rx = cell_x + px_idx * px_w
                        ry = cell_y + py_idx * px_h
                        rect = f'<rect x="{rx}" y="{ry}" width="{px_w}" height="{px_h}" fill="{digit_color}" opacity="0.4" stroke="none" data-digit-pixel="1" data-digit-label="1" style="pointer-events:none"/>'
                        svg_elements.append(rect)
        svg_content = f'<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' + ''.join(svg_elements) + '</svg>'
        print("Successfully processed horizontal sepia pixel image")
        return jsonify({
            'svg': svg_content,
            'palette': palette
        })
    except Exception as e:
        print("Error processing horizontal sepia pixel image:")
        print(traceback.format_exc())
        return jsonify({
            'error': 'Error generating horizontal sepia pixel paint by number',
            'details': str(e)
        }), 500
    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                print(f"Cleaned up temporary directory: {temp_dir}")
            except Exception as cleanup_error:
                print(f"Warning: Could not clean up temporary directory {temp_dir}: {cleanup_error}")

# Инициализируем менеджеры
access_codes_manager = AccessCodesManager()
excel_generator = ExcelGenerator()

@app.route('/api/admin/generate-codes', methods=['POST'])
def generate_access_codes():
    """Генерирует 500 кодов доступа и сохраняет их"""
    try:
        # Генерируем новые коды
        new_codes = access_codes_manager.generate_codes(500)
        
        if not new_codes:
            return jsonify({'error': 'Ошибка при генерации кодов'}), 500
        
        # Создаем Excel файл
        excel_filename = excel_generator.generate_access_codes_excel(new_codes)
        
        # Получаем обновленную статистику
        stats = access_codes_manager.get_stats()
        
        return jsonify({
            'success': True,
            'message': f'Сгенерировано {len(new_codes)} кодов доступа',
            'excel_file': excel_filename,
            'total_codes': stats['total_codes']
        })
        
    except Exception as e:
        print(f"Error generating access codes: {e}")
        return jsonify({'error': 'Ошибка при генерации кодов'}), 500

@app.route('/api/admin/download-codes/<filename>', methods=['GET'])
def download_codes(filename):
    """Скачивает Excel файл с кодами"""
    try:
        file_path = excel_generator.get_excel_file_path(filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return jsonify({'error': 'Файл не найден'}), 404
    except Exception as e:
        return jsonify({'error': 'Ошибка при скачивании файла'}), 500

@app.route('/api/verify-code', methods=['POST'])
def verify_access_code():
    """Проверяет код доступа"""
    try:
        data = request.get_json()
        code = data.get('code', '').strip()
        
        result = access_codes_manager.verify_code(code)
        return jsonify(result)
        
    except Exception as e:
        print(f"Error verifying code: {e}")
        return jsonify({'error': 'Ошибка при проверке кода'}), 500

@app.route('/api/admin/stats', methods=['GET'])
def get_access_stats():
    """Получает статистику по кодам доступа"""
    try:
        stats = access_codes_manager.get_stats()
        return jsonify(stats)
        
    except Exception as e:
        print(f"Error getting stats: {e}")
        return jsonify({'error': 'Ошибка при получении статистики'}), 500

@app.route('/api/admin/generate-stats-excel', methods=['POST'])
def generate_stats_excel():
    """Генерирует Excel файл со статистикой"""
    try:
        stats = access_codes_manager.get_stats()
        excel_filename = excel_generator.generate_stats_excel(stats)
        
        return jsonify({
            'success': True,
            'message': 'Excel файл со статистикой создан',
            'excel_file': excel_filename
        })
        
    except Exception as e:
        print(f"Error generating stats excel: {e}")
        return jsonify({'error': 'Ошибка при создании файла статистики'}), 500

@app.route('/api/admin/list-excel-files', methods=['GET'])
def list_excel_files():
    """Возвращает список всех Excel файлов"""
    try:
        files = excel_generator.list_excel_files()
        return jsonify({
            'files': files,
            'count': len(files)
        })
        
    except Exception as e:
        print(f"Error listing excel files: {e}")
        return jsonify({'error': 'Ошибка при получении списка файлов'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 