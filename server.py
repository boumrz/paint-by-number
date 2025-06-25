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

    try:
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            print("Created temporary directory:", temp_dir)
            
            # Save uploaded file
            input_path = os.path.join(temp_dir, 'input.jpg')
            file.save(input_path)
            print("Saved input file to:", input_path)

            # Проверка разрешения изображения (до 2000x2000)
            img = Image.open(input_path)
            width, height = img.size
            if width > 2000 or height > 2000:
                return jsonify({'error': 'Изображение слишком большое. Максимальный размер: 2000x2000 пикселей.'}), 400
            if width != height:
                return jsonify({'error': 'Изображение должно быть квадратным (ширина = высота).'}), 400
            img.close()
            
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

@app.route('/api/convert-pixels', methods=['POST'])
def convert_image_pixels():
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

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            print("Created temporary directory:", temp_dir)
            input_path = os.path.join(temp_dir, 'input.jpg')
            file.save(input_path)
            print("Saved input file to:", input_path)

            # Проверка разрешения изображения (до 2000x2000)
            img = Image.open(input_path)
            width, height = img.size
            if width > 2000 or height > 2000:
                return jsonify({'error': 'Изображение слишком большое. Максимальный размер: 2000x2000 пикселей.'}), 400
            if width != height:
                return jsonify({'error': 'Изображение должно быть квадратным (ширина = высота).'}), 400
            img.close()

            # Фиксированное количество пикселей
            num_pixels_x = 70
            num_pixels_y = 70
            canvas_width = 900
            canvas_height = 900
            max_colors = 15  # Максимальное количество цветов

            # Открываем изображение
            img = cv2.imread(input_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            h, w, _ = img.shape
            print(f"Original image size: {w}x{h}")

            # Изменяем размер изображения до фиксированного количества пикселей
            img = cv2.resize(img, (num_pixels_x, num_pixels_y), interpolation=cv2.INTER_AREA)
            h, w, _ = img.shape
            print(f"Resized to {num_pixels_x}x{num_pixels_y} pixels")

            # Квантование цветов с помощью K-means
            pixels = img.reshape(-1, 3)  # Преобразуем в 2D массив
            kmeans = KMeans(n_clusters=max_colors, random_state=42, n_init=10)
            labels = kmeans.fit_predict(pixels)
            quantized_img = kmeans.cluster_centers_[labels].reshape(h, w, 3).astype(np.uint8)
            
            print(f"Quantized to {max_colors} colors")

            # Рассчитываем размер каждого пикселя на холсте
            pixel_width = canvas_width / num_pixels_x
            pixel_height = canvas_height / num_pixels_y

            # Разбиваем на пиксели
            palette = []
            color_map = {}
            color_idx = 1
            svg_elements = []

            for y in range(num_pixels_y):
                for x in range(num_pixels_x):
                    pixel_color = tuple(int(v) for v in quantized_img[y, x])
                    if pixel_color not in color_map:
                        color_map[pixel_color] = int(color_idx)
                        palette.append({'color': [int(c) for c in pixel_color], 'number': int(color_idx)})
                        color_idx += 1
                    number = color_map[pixel_color]
                    
                    # Рассчитываем позицию пикселя на холсте
                    canvas_x = x * pixel_width
                    canvas_y = y * pixel_height
                    
                    # SVG rect с белой заливкой и номером, но с data-атрибутом для цвета
                    rect = f'<rect x="{canvas_x}" y="{canvas_y}" width="{pixel_width}" height="{pixel_height}" fill="white" stroke="black" stroke-width="1" data-color="rgb({pixel_color[0]}, {pixel_color[1]}, {pixel_color[2]})" data-number="{number}"/>'
                    text = f'<text x="{canvas_x + pixel_width/2}" y="{canvas_y + pixel_height/2 + 5}" font-size="{min(pixel_width, pixel_height)/2}" text-anchor="middle" fill="black">{number}</text>'
                    svg_elements.append(rect)
                    svg_elements.append(text)

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

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            print("Created temporary directory:", temp_dir)
            input_path = os.path.join(temp_dir, 'input.jpg')
            file.save(input_path)
            print("Saved input file to:", input_path)

            # Проверка разрешения изображения (до 2000x2000)
            img = Image.open(input_path)
            width, height = img.size
            if width > 2000 or height > 2000:
                return jsonify({'error': 'Изображение слишком большое. Максимальный размер: 2000x2000 пикселей.'}), 400
            if width != height:
                return jsonify({'error': 'Изображение должно быть квадратным (ширина = высота).'}), 400
            img.close()

            # Фиксированное количество пикселей
            num_pixels_x = 70
            num_pixels_y = 70
            canvas_width = 900
            canvas_height = 900

            # Открываем изображение
            img = cv2.imread(input_path)
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
            palette = []
            color_map = {}
            color_idx = 1
            svg_elements = []

            for y in range(num_pixels_y):
                for x in range(num_pixels_x):
                    gray_level = int(quantized_gray[y, x])
                    pixel_color = BW_PALETTE[gray_level]  # 18 цветов от черного до белого
                    
                    if tuple(pixel_color) not in color_map:
                        color_map[tuple(pixel_color)] = int(color_idx)
                        palette.append({'color': pixel_color, 'number': int(color_idx)})
                        color_idx += 1
                    number = color_map[tuple(pixel_color)]
                    
                    # Рассчитываем позицию пикселя на холсте
                    canvas_x = x * pixel_width
                    canvas_y = y * pixel_height
                    
                    # SVG rect с белой заливкой и номером, но с data-атрибутом для цвета
                    rect = f'<rect x="{canvas_x}" y="{canvas_y}" width="{pixel_width}" height="{pixel_height}" fill="white" stroke="black" stroke-width="1" data-color="rgb({pixel_color[0]}, {pixel_color[1]}, {pixel_color[2]})" data-number="{number}"/>'
                    text = f'<text x="{canvas_x + pixel_width/2}" y="{canvas_y + pixel_height/2 + 5}" font-size="{min(pixel_width, pixel_height)/2}" text-anchor="middle" fill="black">{number}</text>'
                    svg_elements.append(rect)
                    svg_elements.append(text)

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

if __name__ == '__main__':
    app.run(debug=True, port=5000) 