



#get the langlinks of a wikipedia page from its url and if the english link exists return it

def get_langlinks_from_url(url):
    wiki_wiki = wikipediaapi.Wikipedia(user_agent='Iranian Timeline asghariali9877@gmail.com', language='fa')
    page = wiki_wiki.page(url.split('/wiki/')[-1])
    if page.exists():
        langs = page.langlinks
        if langs.get('en'):
            return langs.get('en').fullurl
        else:
            return "<No English page found>"


def convert_wiki_url_to_persian(url):
    # Extract the encoded part after /wiki/
    match = re.search(r'/wiki/(.+)$', url)
    if not match:
        return url
        
    encoded_part = match.group(1)
    # Decode the URL-encoded string
    decoded_part = unquote(encoded_part)
    
    # Reconstruct the URL with the decoded part
    base_url = url[:url.find('/wiki/') + 6]  # Keep the part until /wiki/
    return base_url + decoded_part

#add english links to the dataframe