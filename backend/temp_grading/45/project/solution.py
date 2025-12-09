def solution(a, b):
  # Your code here
  return a+b
if __name__ == "__main__":
    test_cases = [
    {
        "input": [
            1,
            2
        ],
        "output": 3
    },
    {
        "input": [
            5,
            10
        ],
        "output": 15
    },
    {
        "input": [
            -1,
            1
        ],
        "output": 0
    },
    {
        "input": [
            -5,
            -10
        ],
        "output": -15
    }
]
    passed = 0
    print("\n--- Running 4 Test Cases ---")
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