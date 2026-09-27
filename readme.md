# TP4 — Vérification de projets GitHub

Application web qui vérifie si une liste de projets GitHub sont toujours actifs, en interrogeant l'API GitHub.

## Token GitHub

Sans token, l'API GitHub limite à **60 requêtes/heure** → impossible de vérifier 327 projets.

Pour mettre un token :
1. Aller sur https://github.com/settings/tokens
2. Générer un token (classic) avec le scope `repo:status`
3. Le coller dans le champ **Token GitHub** de la page

Avec un token : **5000 requêtes/heure**.

## Résultat sur romulusFR-starred.json

Le TP annonce 2 projets disparus, mais au moment de mon test (septembre 2026), j'en détecte **6** :

1. `dav74/nsi_terminale`
2. `Binary-Hackers/42_Subjects`
3. `dabeaz/generators`
4. `Marak/faker.js`
5. `substack/stream-handbook`
6. `DataHaskell/data-haskell-examples`
