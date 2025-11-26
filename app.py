from flask import Flask, request, jsonify
from flask_cors import CORS
from crowler.conexao.conexao import update_one_skin

app = Flask(__name__)
CORS(app)  # Libera requisições do seu site

@app.route("/update", methods=["POST"])
def update():
    data = request.get_json()
    skin_name = data.get("skin_name")

    if not skin_name:
        return jsonify({"status": "error", "msg": "skin_name não enviado"}), 400

    result = update_one_skin(skin_name)
    return jsonify({"status": "ok", "result": result})

if __name__ == "__main__":
    app.run(port=5000)
