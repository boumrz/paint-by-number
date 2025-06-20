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

            # Настройки размера пикселя
            pixel_size = int(request.form.get('pixel_size', 20))  # по умолчанию 20

            # Открываем изображение
            img = cv2.imread(input_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            h, w, _ = img.shape
            print(f"Image size: {w}x{h}, pixel size: {pixel_size}")

            # Округляем размеры до кратных pixel_size
            new_w = (w // pixel_size) * pixel_size
            new_h = (h // pixel_size) * pixel_size
            img = img[:new_h, :new_w]
            h, w, _ = img.shape

            # Разбиваем на пиксели
            palette = []
            color_map = {}
            color_idx = 1
            svg_elements = []
            svg_w, svg_h = w, h

            for y in range(0, h, pixel_size):
                for x in range(0, w, pixel_size):
                    block = img[y:y+pixel_size, x:x+pixel_size]
                    avg_color = tuple(int(v) for v in np.mean(block.reshape(-1, 3), axis=0))
                    if avg_color not in color_map:
                        color_map[avg_color] = int(color_idx)
                        palette.append({'color': [int(c) for c in avg_color], 'number': int(color_idx)})
                        color_idx += 1
                    number = color_map[avg_color]
                    # SVG rect с заливкой и номером
                    fill = f'rgb{avg_color}'
                    rect = f'<rect x="{x}" y="{y}" width="{pixel_size}" height="{pixel_size}" fill="{fill}" stroke="black" stroke-width="1"/>'
                    text = f'<text x="{x + pixel_size//2}" y="{y + pixel_size//2 + 5}" font-size="{pixel_size//2}" text-anchor="middle" fill="black">{number}</text>'
                    svg_elements.append(rect)
                    svg_elements.append(text)

            svg_content = f'<svg width="{svg_w}" height="{svg_h}" xmlns="http://www.w3.org/2000/svg">' + ''.join(svg_elements) + '</svg>'

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