import random
import subprocess
import re

WINDSCRIBE_CLI_PATH = r"C:\Program Files\Windscribe\windscribe-cli.exe"

def run_ws_command(command_list):
    
    full_command = [WINDSCRIBE_CLI_PATH] + command_list
    print(f"Executando comando: {' '.join(full_command)}")

    try:
        result = subprocess.run(full_command, capture_output=True, text=True, check=True, encoding='utf-8')
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar o comando: {e.stderr}")
        return None
    except FileNotFoundError:
        print(f"Erro: O arquivo '{WINDSCRIBE_CLI_PATH}' não foi encontrado.")
        return None


def get_available_locations():
    
    output = run_ws_command(["locations"])
    if not output:
        return []

    locations = []

    for line in output.splitlines():
        match = re.search(r"^(.*?)\s+\(Available\)$", line.strip())
        if match:
            location_name = match.group(1).strip()
            locations.append(location_name)

    return sorted(list(set(locations)))


def connect_to_random_location():
    
    locations = get_available_locations()
    
    if not locations:
        print("Nenhuma localização disponível encontrada.")
        return

    random_location = random.choice(locations)
    print(f"\n--- Conectando a localização aleatória: {random_location} ---")
    
    # Passa o nome do local para o comando connect
    connect_output = run_ws_command(["connect", random_location])
    
    if connect_output and "Connected" in connect_output:
        print(f"\nSucesso: Conectado a {random_location}.")
    else:
        print(f"\nFalha ao conectar a {random_location}.")