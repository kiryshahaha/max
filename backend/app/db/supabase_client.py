import os
from supabase import create_client, Client

class SupabaseClient:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.url or not self.key:
            raise ValueError(f"Supabase credentials not found. URL: {self.url}, Key: {self.key}")
        
        self.client: Client = create_client(self.url, self.key)
        print("✅ Supabase client initialized successfully")

    def find_all_users_by_email(self, email: str):
        """Находим ВСЕ записи пользователя по email в колонке profile"""
        try:
            # Получаем все записи из user_data
            response = self.client.table("user_data").select("*").execute()
            all_users = response.data
            
            print(f"🔍 Searching for email '{email}' in {len(all_users)} user profiles")
            
            matching_users = []
            for user_data in all_users:
                profile = user_data.get('profile', {})
                
                # Проверяем email в разных местах профиля
                if isinstance(profile, dict):
                    # Прямой email в профиле
                    if profile.get('email') == email:
                        print(f"✅ Found user by direct email in profile")
                        matching_users.append(user_data)
                        continue
                    
                    # Email в контактах
                    contacts = profile.get('contacts', {})
                    if isinstance(contacts, dict) and contacts.get('email') == email:
                        print(f"✅ Found user by email in contacts")
                        matching_users.append(user_data)
                        continue
                    
                    # Account email
                    if profile.get('accountEmail') == email:
                        print(f"✅ Found user by accountEmail")
                        matching_users.append(user_data)
                        continue
            
            print(f"✅ Found {len(matching_users)} user records for email '{email}'")
            return matching_users
            
        except Exception as e:
            print(f"❌ Error searching users by email: {e}")
            return []

    def get_tasks_by_email(self, email: str):
        """Получаем задачи пользователя по email - ищем в ВСЕХ записях"""
        all_user_records = self.find_all_users_by_email(email)
        
        if not all_user_records:
            print(f"❌ No user records found for {email}")
            return []
        
        # Ищем задачи в каждой записи, пока не найдем непустые
        all_tasks = []
        for user_data in all_user_records:
            if user_data and 'tasks' in user_data:
                tasks = user_data['tasks']
                # Гарантируем, что возвращаем список
                if tasks is None:
                    tasks = []
                elif not isinstance(tasks, list):
                    tasks = [tasks]
                
                # Если нашли непустые задачи, добавляем их
                if tasks:
                    print(f"✅ Found {len(tasks)} tasks in one record for {email}")
                    all_tasks.extend(tasks)
        
        # Убираем дубликаты (если есть)
        unique_tasks = self._remove_duplicate_tasks(all_tasks)
        print(f"✅ Total unique tasks for {email}: {len(unique_tasks)}")
        return unique_tasks

    def get_profile_by_email(self, email: str):
        """Получаем профиль пользователя - берем из первой записи с самым полным профилем"""
        all_user_records = self.find_all_users_by_email(email)
        
        if not all_user_records:
            print(f"❌ No profile found for {email}")
            return {}
        
        # Ищем запись с самым полным профилем
        best_profile = {}
        for user_data in all_user_records:
            profile = user_data.get('profile', {})
            if profile and isinstance(profile, dict):
                # Если текущий профиль полнее предыдущего, обновляем
                if len(str(profile)) > len(str(best_profile)):
                    best_profile = profile
        
        # Гарантируем, что возвращаем словарь
        if best_profile is None:
            best_profile = {}
        
        # Добавляем user_id из первой записи для удобства
        if all_user_records and not best_profile.get('user_id'):
            best_profile['user_id'] = all_user_records[0].get('user_id')
        
        print(f"✅ Found profile for {email} with {len(best_profile)} fields")
        return best_profile

    def get_schedule_by_email(self, email: str, week: int = None):
        """Получаем расписание пользователя - ищем в ВСЕХ записях"""
        all_user_records = self.find_all_users_by_email(email)
        
        if not all_user_records:
            print(f"❌ No schedule found for {email}")
            return {}
        
        # Ищем расписание в каждой записи
        best_schedule = {}
        for user_data in all_user_records:
            schedule = user_data.get('schedule', {})
            if schedule and isinstance(schedule, dict):
                # Если нашли непустое расписание и оно полнее предыдущего
                if schedule and len(str(schedule)) > len(str(best_schedule)):
                    best_schedule = schedule
            
            # Если указана неделя, ищем в schedule_year
            if week and 'schedule_year' in user_data:
                schedule_year = user_data.get('schedule_year', {})
                if isinstance(schedule_year, dict):
                    for week_key, week_schedule in schedule_year.items():
                        if isinstance(week_schedule, dict) and week_schedule.get('week') == week:
                            if week_schedule and len(str(week_schedule)) > len(str(best_schedule)):
                                best_schedule = week_schedule
                                print(f"✅ Found schedule for week {week} for {email}")
        
        # Гарантируем, что возвращаем словарь
        if best_schedule is None:
            best_schedule = {}
        
        print(f"✅ Found schedule for {email} with {len(best_schedule)} fields")
        return best_schedule

    def get_marks_by_email(self, email: str):
        """Получаем оценки пользователя - ищем в ВСЕХ записях"""
        all_user_records = self.find_all_users_by_email(email)
        
        if not all_user_records:
            print(f"❌ No marks found for {email}")
            return []
        
        # Ищем оценки в каждой записи
        all_marks = []
        for user_data in all_user_records:
            if user_data and 'marks' in user_data:
                marks = user_data['marks']
                # Гарантируем, что возвращаем список
                if marks is None:
                    marks = []
                elif not isinstance(marks, list):
                    marks = [marks]
                
                # Если нашли непустые оценки, добавляем их
                if marks:
                    print(f"✅ Found {len(marks)} marks in one record for {email}")
                    all_marks.extend(marks)
        
        # Убираем дубликаты
        unique_marks = self._remove_duplicate_marks(all_marks)
        print(f"✅ Total unique marks for {email}: {len(unique_marks)}")
        return unique_marks

    def get_reports_by_email(self, email: str):
        """Получаем отчеты пользователя - ищем в ВСЕХ записях"""
        all_user_records = self.find_all_users_by_email(email)
        
        if not all_user_records:
            print(f"❌ No reports found for {email}")
            return []
        
        # Ищем отчеты в каждой записи
        all_reports = []
        for user_data in all_user_records:
            if user_data and 'reports' in user_data:
                reports = user_data['reports']
                # Гарантируем, что возвращаем список
                if reports is None:
                    reports = []
                elif not isinstance(reports, list):
                    reports = [reports]
                
                # Если нашли непустые отчеты, добавляем их
                if reports:
                    print(f"✅ Found {len(reports)} reports in one record for {email}")
                    all_reports.extend(reports)
        
        # Убираем дубликаты - НОВАЯ ЛОГИКА
        unique_reports = self._remove_true_duplicates(all_reports)
        print(f"✅ Total unique reports for {email}: {len(unique_reports)}")
        return unique_reports

    def get_materials_by_email(self, email: str):
        """Получаем материалы пользователя - ищем в ВСЕХ записях"""
        all_user_records = self.find_all_users_by_email(email)
        
        if not all_user_records:
            print(f"❌ No materials found for {email}")
            return []
        
        # Ищем материалы в каждой записи
        all_materials = []
        for user_data in all_user_records:
            if user_data and 'materials' in user_data:
                materials = user_data['materials']
                # Гарантируем, что возвращаем список
                if materials is None:
                    materials = []
                elif not isinstance(materials, list):
                    materials = [materials]
                
                # Если нашли непустые материалы, добавляем их
                if materials:
                    print(f"✅ Found {len(materials)} materials in one record for {email}")
                    all_materials.extend(materials)
        
        # Убираем дубликаты - НОВАЯ ЛОГИКА
        unique_materials = self._remove_true_duplicates(all_materials)
        print(f"✅ Total unique materials for {email}: {len(unique_materials)}")
        return unique_materials

    def _remove_true_duplicates(self, items):
        """Убираем только настоящие дубликаты (полностью идентичные объекты)"""
        if not items:
            return []
        
        unique_items = []
        seen_items = set()
        
        for item in items:
            # Создаем хеш для каждого элемента
            item_hash = self._create_item_hash(item)
            if item_hash not in seen_items:
                seen_items.add(item_hash)
                unique_items.append(item)
        
        return unique_items

    def _create_item_hash(self, item):
        """Создает уникальный хеш для элемента"""
        if isinstance(item, dict):
            # Сортируем ключи для консистентности
            sorted_item = {k: item[k] for k in sorted(item.keys())}
            return str(sorted_item)
        else:
            return str(item)

    def _remove_duplicate_tasks(self, tasks):
        """Убираем дубликаты задач по ID и названию"""
        return self._remove_true_duplicates(tasks)

    def _remove_duplicate_marks(self, marks):
        """Убираем дубликаты оценок по ID и предмету"""
        return self._remove_true_duplicates(marks)

    def _remove_duplicate_reports(self, reports):
        """Убираем дубликаты отчетов - ИСПРАВЛЕННАЯ ЛОГИКА"""
        return self._remove_true_duplicates(reports)

    def _remove_duplicate_materials(self, materials):
        """Убираем дубликаты материалов"""
        return self._remove_true_duplicates(materials)

    def get_user_comprehensive_data(self, email: str):
        """Получаем все данные пользователя из ВСЕХ записей"""
        all_user_records = self.find_all_users_by_email(email)
        
        if not all_user_records:
            return {"error": "User not found"}
        
        comprehensive_data = {
            "email": email,
            "total_records": len(all_user_records),
            "profile": self.get_profile_by_email(email),
            "tasks": self.get_tasks_by_email(email),
            "schedule": self.get_schedule_by_email(email),
            "marks": self.get_marks_by_email(email),
            "reports": self.get_reports_by_email(email),
            "materials": self.get_materials_by_email(email),
            "user_ids": [record.get('user_id') for record in all_user_records],
            "last_updated": max([record.get('updated_at', '') for record in all_user_records if record.get('updated_at')])
        }
        
        return comprehensive_data

# Создаем глобальный экземпляр клиента
supabase_client = SupabaseClient()