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

if __name__ == '__main__':
    app.run(debug=True, port=5000) 