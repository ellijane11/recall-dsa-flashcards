# LeetCode Hashing Flashcards

---

## 1. Two Sum (Easy)

**Front**
Given an integer array `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Exactly one solution exists, and you can't use the same element twice.
Example: `nums = [2, 7, 11, 15]`, `target = 9` → `[0, 1]`

**Back**
Pattern: hashmap of value → index. For each `x`, check whether `target - x` is already in the map, then store `x`. Check before inserting so an element can't pair with itself.
O(n) time, O(n) space.

```python
def twoSum(nums, target):
    seen = {}                        # value -> index
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
```

---

## 217. Contains Duplicate (Easy)

**Front**
Given an integer array `nums`, return `true` if any value appears at least twice, and `false` if every element is distinct.
Example: `[1, 2, 3, 1]` → `true`

**Back**
Pattern: set. Add each element to a set, and return `true` if it's already there. Shortcut: `len(set(nums)) != len(nums)`.
O(n) time, O(n) space.

```python
def containsDuplicate(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False
```

---

## 242. Valid Anagram (Easy)

**Front**
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s` (same letters with the same counts, in any order).
Examples: `"anagram"`, `"nagaram"` → `true`; `"rat"`, `"car"` → `false`

**Back**
Pattern: frequency counting. If the lengths differ, return `false`. Otherwise compare the two counters.
O(n) time, O(1) space for a fixed alphabet.

```python
from collections import Counter

def isAnagram(s, t):
    if len(s) != len(t):
        return False
    return Counter(s) == Counter(t)
```

---

## 49. Group Anagrams (Medium)

**Front**
Given an array of strings, group the anagrams together. The groups can be returned in any order.
Example: `["eat","tea","tan","ate","nat","bat"]` → `[["eat","tea","ate"],["tan","nat"],["bat"]]`

**Back**
Pattern: canonical key. Use a dict keyed by a 26-count tuple (or `tuple(sorted(word))`). All anagrams share the same key.
O(n·L) with count keys, O(n·L log L) with sorting.

```python
from collections import defaultdict

def groupAnagrams(strs):
    groups = defaultdict(list)
    for w in strs:
        count = [0] * 26
        for c in w:
            count[ord(c) - ord('a')] += 1
        groups[tuple(count)].append(w)   # lists can't be keys, tuples can
    return list(groups.values())
```

---

## 347. Top K Frequent Elements (Medium)

**Front**
Given an integer array `nums` and an integer `k`, return the `k` most frequent elements, in any order.
Example: `nums = [1,1,1,2,2,3]`, `k = 2` → `[1, 2]`

**Back**
Pattern: frequency map plus bucket sort. `buckets[f]` holds the values that appear `f` times. Read from the highest bucket down until you have `k` values.
O(n) time. (Heap alternative: `heapq.nlargest(k, count, key=count.get)`, O(n log k).)

```python
from collections import Counter

def topKFrequent(nums, k):
    count = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]   # index = frequency
    for x, f in count.items():
        buckets[f].append(x)
    res = []
    for f in range(len(buckets) - 1, 0, -1):
        for x in buckets[f]:
            res.append(x)
            if len(res) == k:
                return res
```

---

## 205. Isomorphic Strings (Easy)

**Front**
Given two strings `s` and `t`, determine whether they are isomorphic: the characters in `s` can be replaced to get `t`. Order must be preserved, every occurrence of a character must map to the same character, and no two different characters may map to the same one. A character may map to itself.
Examples: `"egg"`, `"add"` → `true`; `"foo"`, `"bar"` → `false`; `"paper"`, `"title"` → `true`

**Back**
Pattern: two-way mapping. Keep `s→t` and `t→s` and check both directions on each pair. One dict alone misses `"badc"`, `"baba"`.
O(n) time, O(1) space for a fixed alphabet.

```python
def isIsomorphic(s, t):
    if len(s) != len(t):
        return False
    s2t, t2s = {}, {}
    for a, b in zip(s, t):
        if s2t.get(a, b) != b or t2s.get(b, a) != a:
            return False
        s2t[a], t2s[b] = b, a
    return True
```

---

## 128. Longest Consecutive Sequence (Medium)

**Front**
Given an unsorted integer array `nums`, return the length of the longest sequence of consecutive integers. The algorithm must run in O(n) time.
Example: `[100, 4, 200, 1, 3, 2]` → `4` (the sequence 1, 2, 3, 4)

**Back**
Pattern: set, start only at sequence beginnings. For each `x` where `x - 1` is not in the set, count upward `x+1, x+2, …`. Each number is visited by only one run, so the total is linear.
O(n) time, O(n) space.

```python
def longestConsecutive(nums):
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:            # x starts a sequence
            length = 1
            while x + length in s:
                length += 1
            best = max(best, length)
    return best
```

---

## 560. Subarray Sum Equals K (Medium)

**Front**
Given an integer array `nums` and an integer `k`, return the total number of contiguous subarrays whose sum equals `k`. The array may contain negative numbers.
Example: `nums = [1, 1, 1]`, `k = 2` → `2`

**Back**
Pattern: prefix sum + hashmap of counts. At each step, the number of subarrays ending here with sum `k` equals `count[prefix - k]`. Then do `count[prefix] += 1`. Initialize `count = {0: 1}`.
Sliding window fails here because of negatives.
O(n) time, O(n) space.

```python
from collections import defaultdict

def subarraySum(nums, k):
    count = defaultdict(int)
    count[0] = 1                      # empty prefix
    prefix = res = 0
    for x in nums:
        prefix += x
        res += count[prefix - k]
        count[prefix] += 1
    return res
```

---

## 3. Longest Substring Without Repeating Characters (Medium)

**Front**
Given a string `s`, return the length of the longest substring that contains no repeated characters.
Example: `"abcabcbb"` → `3` (`"abc"`)

**Back**
Pattern: sliding window + last-seen index. Move the right pointer, and if the character was last seen inside the window, jump `left` to `last[c] + 1`. Update `last[c]` and track the max length.
O(n) time, O(min(n, alphabet)) space.

```python
def lengthOfLongestSubstring(s):
    last = {}                         # char -> most recent index
    left = best = 0
    for right, c in enumerate(s):
        if c in last and last[c] >= left:
            left = last[c] + 1
        last[c] = right
        best = max(best, right - left + 1)
    return best
```

---

## 1497. Check If Array Pairs Are Divisible by k (Medium)

**Front**
Given an integer array `arr` of even length `n` and an integer `k`, return `true` if the array can be divided into `n / 2` pairs such that each pair's sum is divisible by `k`.
Examples: `[1,2,3,4,5,10,6,7,8,9]`, `k = 5` → `true`; `[1,2,3,4,5,6]`, `k = 10` → `false`

**Back**
Pattern: remainder counting. Count `x % k` (Python's `%` is already non-negative for positive `k`; in other languages use `((x % k) + k) % k`). Then:
- Remainder 0: its count must be even.
- Remainder `k/2` (when `k` is even): its count must be even.
- Otherwise: `count[r] == count[k - r]`.
O(n + k) time.

```python
from collections import Counter

def canArrange(arr, k):
    freq = Counter(x % k for x in arr)
    for r, c in freq.items():
        if r == 0 or 2 * r == k:      # pairs with itself
            if c % 2:
                return False
        elif freq.get(k - r, 0) != c: # needs an equal count of k - r
            return False
    return True
```

---

## 219. Contains Duplicate II (Easy)

**Front**
Given an integer array `nums` and an integer `k`, return `true` if there are two distinct indices `i` and `j` such that `nums[i] == nums[j]` and `abs(i - j) <= k`. Otherwise return `false`.
Example: `nums = [1, 2, 3, 1]`, `k = 3` → `true`

**Back**
Pattern: hashmap of last-seen index (same idea as Two Sum). For a repeated value, the closest earlier match is its most recent occurrence. Always update the index, even when the check fails (gotcha: `[1, 0, 1, 1]`, `k = 1`).
O(n) time, O(n) space. Follow-up: a sliding window set of size `k` cuts space to O(min(n, k)).

```python
def containsNearbyDuplicate(nums, k):
    last = {}
    for i, x in enumerate(nums):
        if x in last and i - last[x] <= k:
            return True
        last[x] = i
    return False
```

---

## 706. Design HashMap (Easy)

**Front**
Design a hash map without using any built-in hash table library. Implement `MyHashMap` with:
- `put(key, value)`: insert, or update the value if the key already exists
- `get(key)`: return the value, or `-1` if the key is absent
- `remove(key)`: remove the key and its value if present

Keys and values are in the range `0` to `10^6`.

**Back**
Pattern: array of buckets with separate chaining. Pick a size such as 1009 (a prime) and use `index = key % size`. Each bucket is a list of `[key, value]` pairs: scan it to update, read or delete.
Average O(1) per operation.

```python
class MyHashMap:
    def __init__(self):
        self.size = 1009
        self.buckets = [[] for _ in range(self.size)]

    def put(self, key, value):
        bucket = self.buckets[key % self.size]
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value
                return
        bucket.append([key, value])

    def get(self, key):
        for k, v in self.buckets[key % self.size]:
            if k == key:
                return v
        return -1

    def remove(self, key):
        bucket = self.buckets[key % self.size]
        for i, (k, v) in enumerate(bucket):
            if k == key:
                bucket.pop(i)
                return
```
