import { Problem } from "../../types/index.ts";

export const problems: Problem[] = [
  {
    "id": "p1",
    "title": "Two Sum",
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "difficulty": "Easy",
    "topic": "Arrays",
    "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
    "examples": [
      {
        "input": "nums = [2,7,11,15], target = 9",
        "output": "[0,1]",
        "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
      }
    ]
  },
  {
    "id": "p2",
    "title": "Longest Substring Without Repeating Characters",
    "description": "Given a string s, find the length of the longest substring without repeating characters.",
    "difficulty": "Medium",
    "topic": "Strings",
    "constraints": ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    "examples": [
      {
        "input": "s = \"abcabcbb\"",
        "output": "3",
        "explanation": "The answer is \"abc\", with the length of 3."
      }
    ]
  },
  {
    "id": "p3",
    "title": "Merge k Sorted Lists",
    "description": "You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.",
    "difficulty": "Hard",
    "topic": "Linked Lists",
    "constraints": ["k == lists.length", "0 <= k <= 10^4", "0 <= lists[i].length <= 500"],
    "examples": [
      {
        "input": "lists = [[1,4,5],[1,3,4],[2,6]]",
        "output": "[1,1,2,3,4,4,5,6]"
      }
    ]
  }
];
