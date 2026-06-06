import traceback
from main import run_pipeline

if __name__ == "__main__":
    try:
        print("Running pipeline...")
        result = run_pipeline("Brain-computer interfaces")
        print("Result:", "Success" if result else "Failed")
    except Exception as e:
        print("Exception caught!")
        traceback.print_exc()
