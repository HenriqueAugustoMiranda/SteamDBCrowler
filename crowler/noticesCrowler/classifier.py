from . import themes as t

def classify_text(title: str, description: str):
    
    text = (title + " " + description).lower()

    matched = []

    for theme_name, keywords in t.themes.items():
        for kw in keywords:
            if kw.lower() in text:
                matched.append(theme_name)
                break

    if not matched:
        matched = ["Other"]

    return matched
