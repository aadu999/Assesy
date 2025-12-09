def solution(s):
  # Your code here
  print("Pallindrome")
  pass
if __name__ == "__main__":
    test_cases = [
    {
        "input": [
            "radar"
        ],
        "output": True
    },
    {
        "input": [
            "hello"
        ],
        "output": False
    }
]
    passed = 0
    print("\n--- Running 2 Test Cases ---")
    for i, tc in enumerate(test_cases):
        try:
            result = solution(*tc["input"])
            if result == tc["output"]:
                print(f"Test {i+1}: PASS ✓")
                passed += 1
            else:
                print(f"Test {i+1}: FAIL ✗ (Expected {tc['output']}, Got {result})")
        except Exception as e:
            print(f"Test {i+1}: ERROR - {e}")
    print(f"\nTotal: {passed}/{len(test_cases)} passed")