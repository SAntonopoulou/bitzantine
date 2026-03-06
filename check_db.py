from sqlmodel import create_engine, inspect
import os

DATABASE_URL = "sqlite:///./backend/database_v2.db"
engine = create_engine(DATABASE_URL)

inspector = inspect(engine)
print("Tables:", inspector.get_table_names())

try:
    columns = inspector.get_columns("loreera")
    print("LoreEra columns:", [c['name'] for c in columns])
except Exception as e:
    print("Error inspecting loreera:", e)
