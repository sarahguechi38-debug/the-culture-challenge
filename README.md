# The Culture Challenge — Le Grand Quiz Interculturel

Application web multijoueur France / États-Unis, avec interface candidat sur mobile et régie présentateur sur ordinateur.

## Fonctionnalités
- Intro immersive et inscription par pseudo/avatar.
- QR code de participation généré automatiquement à partir de l'adresse publique du site.
- 8 questions en 3 manches, réponses sur smartphone.
- Correction et explication affichées par le présentateur.
- Classement en direct et podium final.
- Jusqu'à 60 participants simultanés (limite indicative, à adapter selon l'hébergement).

## Lancer en local
Prérequis : Node.js 18 ou plus.
```bash
npm install
npm start
```
Ouvrir `http://localhost:3000/` pour le parcours participant et `http://localhost:3000/host.html` pour la régie.

Pour tester sur plusieurs téléphones du même réseau Wi-Fi, utiliser l'adresse IP locale de l'ordinateur à la place de `localhost` (ex. `http://192.168.1.20:3000`). Le pare-feu doit autoriser le port 3000.

## Mise en ligne pour l'établissement
Le QR code ne peut être utilisé à distance qu'une fois l'application déployée sur un hébergeur public qui prend en charge Node.js et les connexions WebSocket (par exemple Render, Railway ou un serveur de l'établissement).
1. Déployer ce dossier comme application Node.js.
2. La commande de démarrage est `npm start`.
3. Une fois l'URL publique obtenue, ouvrir `/host.html`.
4. Le QR code affiché dans la régie pointera automatiquement vers la page d'inscription publique.

**Important :** l'adresse locale ou le QR code de test ne sera pas accessible depuis Internet. Il faut effectuer le déploiement avant la présentation en classe.

## Déroulé conseillé
- Présentation et règles : 1 min.
- Manche 1 — Vrai ou faux : 3 min.
- Manche 2 — Le bon réflexe : 5 min.
- Manche 3 — Que ferais-tu ? : 3 min.
- Révéler chaque réponse après les votes, lire l'explication, puis cliquer sur « Question suivante ».
- Le podium apparaît automatiquement après la 8e question.

## À savoir
- Chaque bonne réponse rapporte 1 point. Les mauvaises réponses ne retirent aucun point.
- Les participants qui ferment leur navigateur sont retirés du classement.
- Le serveur conserve les scores uniquement pendant la partie en cours ; un redémarrage remet la partie à zéro.
- Le quiz présente des tendances professionnelles générales, pas des règles absolues : les pratiques varient selon les entreprises, les secteurs et les individus.
