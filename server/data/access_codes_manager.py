import os
import json
import random
import string
import hashlib
import datetime
from typing import Dict, List, Optional

class AccessCodesManager:
    def __init__(self, data_dir="data"):
        """
        Инициализация менеджера кодов доступа
        
        Args:
            data_dir (str): Директория для хранения данных
        """
        self.data_dir = data_dir
        self.codes_file = os.path.join(data_dir, "access_codes.json")
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Создает директорию для данных, если она не существует"""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def load_access_codes(self) -> Dict:
        """
        Загружает коды доступа из файла
        
        Returns:
            dict: Словарь с данными кодов
        """
        if os.path.exists(self.codes_file):
            try:
                with open(self.codes_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading access codes: {e}")
                return self._get_default_structure()
        return self._get_default_structure()
    
    def save_access_codes(self, codes_data: Dict) -> bool:
        """
        Сохраняет коды доступа в файл
        
        Args:
            codes_data (dict): Данные кодов для сохранения
            
        Returns:
            bool: True если сохранение прошло успешно
        """
        try:
            with open(self.codes_file, 'w', encoding='utf-8') as f:
                json.dump(codes_data, f, ensure_ascii=False, indent=2)
            return True
        except IOError as e:
            print(f"Error saving access codes: {e}")
            return False
    
    def _get_default_structure(self) -> Dict:
        """Возвращает структуру по умолчанию для данных кодов"""
        return {
            'codes': [],
            'generated_at': None,
            'version': '1.0'
        }
    
    def generate_access_code(self) -> str:
        """
        Генерирует один код доступа в формате XXXX-XXXX-XXXX
        
        Returns:
            str: Сгенерированный код
        """
        digits = ''.join(random.choices(string.digits, k=12))
        return f"{digits[:4]}-{digits[4:8]}-{digits[8:12]}"
    
    def hash_code(self, code: str) -> str:
        """
        Хеширует код для безопасного хранения
        
        Args:
            code (str): Код для хеширования
            
        Returns:
            str: Хеш кода
        """
        return hashlib.sha256(code.encode()).hexdigest()
    
    def generate_codes(self, count: int = 500) -> List[Dict]:
        """
        Генерирует указанное количество уникальных кодов доступа
        
        Args:
            count (int): Количество кодов для генерации
            
        Returns:
            list: Список сгенерированных кодов
        """
        codes_data = self.load_access_codes()
        existing_codes = {code['code'] for code in codes_data['codes']}
        
        new_codes = []
        attempts = 0
        max_attempts = count * 10  # Защита от бесконечного цикла
        
        while len(new_codes) < count and attempts < max_attempts:
            code = self.generate_access_code()
            if code not in existing_codes:
                new_codes.append({
                    'code': code,
                    'hash': self.hash_code(code),
                    'used': False,
                    'used_at': None,
                    'generated_at': json.dumps(datetime.datetime.now().isoformat())
                })
                existing_codes.add(code)
            attempts += 1
        
        # Добавляем новые коды к существующим
        codes_data['codes'].extend(new_codes)
        codes_data['generated_at'] = json.dumps(datetime.datetime.now().isoformat())
        
        # Сохраняем обновленные данные
        if self.save_access_codes(codes_data):
            return new_codes
        else:
            return []
    
    def verify_code(self, code: str) -> Dict:
        """
        Проверяет код доступа
        
        Args:
            code (str): Код для проверки
            
        Returns:
            dict: Результат проверки
                {'valid': bool, 'message': str}
        """
        if not code or not code.strip():
            return {'valid': False, 'message': 'Код не предоставлен'}
        
        codes_data = self.load_access_codes()
        
        # Ищем код
        for code_data in codes_data['codes']:
            if code_data['code'] == code.strip():
                if code_data['used']:
                    return {'valid': False, 'message': 'Код уже использован'}
                else:
                    # Помечаем код как использованный
                    code_data['used'] = True
                    code_data['used_at'] = json.dumps(datetime.datetime.now().isoformat())
                    
                    if self.save_access_codes(codes_data):
                        return {'valid': True, 'message': 'Код действителен'}
                    else:
                        return {'valid': False, 'message': 'Ошибка при сохранении данных'}
        
        return {'valid': False, 'message': 'Неверный код'}
    
    def get_stats(self) -> Dict:
        """
        Получает статистику по кодам доступа
        
        Returns:
            dict: Статистика
                {'total_codes': int, 'used_codes': int, 'unused_codes': int, 'generated_at': str}
        """
        codes_data = self.load_access_codes()
        total_codes = len(codes_data['codes'])
        used_codes = sum(1 for code in codes_data['codes'] if code['used'])
        unused_codes = total_codes - used_codes
        
        return {
            'total_codes': total_codes,
            'used_codes': used_codes,
            'unused_codes': unused_codes,
            'generated_at': codes_data.get('generated_at')
        }
    
    def get_all_codes(self) -> List[Dict]:
        """
        Получает все коды доступа
        
        Returns:
            list: Список всех кодов
        """
        codes_data = self.load_access_codes()
        return codes_data['codes']
    
    def delete_code(self, code: str) -> bool:
        """
        Удаляет код доступа
        
        Args:
            code (str): Код для удаления
            
        Returns:
            bool: True если код удален
        """
        codes_data = self.load_access_codes()
        original_length = len(codes_data['codes'])
        
        codes_data['codes'] = [c for c in codes_data['codes'] if c['code'] != code]
        
        if len(codes_data['codes']) < original_length:
            return self.save_access_codes(codes_data)
        return False
    
    def reset_code_usage(self, code: str) -> bool:
        """
        Сбрасывает статус использования кода
        
        Args:
            code (str): Код для сброса
            
        Returns:
            bool: True если статус сброшен
        """
        codes_data = self.load_access_codes()
        
        for code_data in codes_data['codes']:
            if code_data['code'] == code:
                code_data['used'] = False
                code_data['used_at'] = None
                return self.save_access_codes(codes_data)
        
        return False
    
    def cleanup_old_codes(self, days_old: int = 30) -> int:
        """
        Удаляет старые неиспользованные коды
        
        Args:
            days_old (int): Возраст кодов в днях для удаления
            
        Returns:
            int: Количество удаленных кодов
        """
        codes_data = self.load_access_codes()
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days_old)
        
        original_length = len(codes_data['codes'])
        
        # Фильтруем коды, оставляя только новые или использованные
        codes_data['codes'] = [
            code for code in codes_data['codes']
            if code['used'] or (
                code.get('generated_at') and 
                datetime.datetime.fromisoformat(json.loads(code['generated_at']).replace('Z', '+00:00')) > cutoff_date
            )
        ]
        
        deleted_count = original_length - len(codes_data['codes'])
        
        if deleted_count > 0:
            self.save_access_codes(codes_data)
        
        return deleted_count 