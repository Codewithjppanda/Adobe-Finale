#!/usr/bin/env python3

import requests

def test_semantic_search():
    """Test the semantic search functionality with various queries"""
    
    # Test various search queries to demonstrate the semantic matching
    test_queries = [
        'Italian appetizer with cheese',
        'breakfast with eggs and milk', 
        'vegetarian side dish',
        'quick lunch ideas',
        'protein rich meal'
    ]

    for query in test_queries:
        print(f'\n🔍 Search: "{query}"')
        try:
            response = requests.post('http://127.0.0.1:8000/v1/search/query', 
                                   data={'text': query, 'k': 3})
            if response.status_code == 200:
                matches = response.json().get('matches', [])
                print(f'  Found {len(matches)} matches:')
                for i, match in enumerate(matches[:3]):
                    print(f'    {i+1}. {match["section_heading"]} ({match["pdf_name"]}) - Score: {match["score"]:.3f}')
                    print(f'       PDF: {match["filename"]}')
                    print(f'       Content: {match["section_content"][:100]}...')
            else:
                print(f'  Error: {response.status_code}')
        except Exception as e:
            print(f'  Error: {e}')

if __name__ == "__main__":
    test_semantic_search()
