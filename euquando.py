import random

def main():
    x = 10
    palavras = ["eu", "quando", "sua", "mãe"]
    while x:
        print(random.choice(palavras), end=" ")
        x -= 1

main()
