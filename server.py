from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from src.pbn_gen import PbnGen
import tempfile
import json
import traceback
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/api/convert', methods=['POST'])
def convert_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            print("Created temporary directory:", temp_dir)
            
            # Save uploaded file
            input_path = os.path.join(temp_dir, 'input.jpg')
            file.save(input_path)
            print("Saved input file to:", input_path)
            
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

    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            print("Created temporary directory:", temp_dir)
            input_path = os.path.join(temp_dir, 'input.jpg')
            file.save(input_path)
            print("Saved input file to:", input_path)

            import cv2
            from PIL import Image

            # Фиксированное количество пикселей
            num_pixels_x = 50
            num_pixels_y = 50
            canvas_width = 800
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
                    pixel_color = tuple(int(v) for v in img[y, x])
                    if pixel_color not in color_map:
                        color_map[pixel_color] = int(color_idx)
                        palette.append({'color': [int(c) for c in pixel_color], 'number': int(color_idx)})
                        color_idx += 1
                    number = color_map[pixel_color]
                    
                    # Рассчитываем позицию пикселя на холсте
                    canvas_x = x * pixel_width
                    canvas_y = y * pixel_height
                    
                    # SVG rect с заливкой и номером
                    fill = f'rgb{pixel_color}'
                    rect = f'<rect x="{canvas_x}" y="{canvas_y}" width="{pixel_width}" height="{pixel_height}" fill="{fill}" stroke="black" stroke-width="1"/>'
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

if __name__ == '__main__':
    app.run(debug=True, port=5000) 