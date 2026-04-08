class TrieNode {
  constructor() {
    this.children = {}
    this.isEndOfWord = false
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode()
  }

  insert(word) {
    let node = this.root
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode()
      }
      node = node.children[char]
    }
    node.isEndOfWord = true
  }

  clear() {
    this.root = new TrieNode()
  }

  search(prefix) {
    let node = this.root
    for (const char of prefix) {
      if (!node.children[char]) {
        return []
      }
      node = node.children[char]
    }
    return this._collectWords(node, prefix)
  }

  _collectWords(node, prefix) {
    const results = []
    if (node.isEndOfWord) {
      results.push(prefix)
    }
    for (const [char, childNode] of Object.entries(node.children)) {
      results.push(...this._collectWords(childNode, prefix + char))
    }
    return results
  }
}
