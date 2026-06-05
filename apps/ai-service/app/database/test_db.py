from connection import engine

try:
    with engine.connect() as conn:
        result = conn.exec_driver_sql("SELECT version();")
        print(result.fetchone())

    print("Connected successfully!")

except Exception as ex:
    print("ERROR:", ex)