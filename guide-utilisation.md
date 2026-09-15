# Guide d'utilisation - Générateur QR Code pour Niimbot D110A

## Vue d'ensemble

Cette application web permet de convertir n'importe quelle URL en code QR et de l'imprimer directement sur votre imprimante d'étiquettes Niimbot D110A via Bluetooth. L'application fonctionne entièrement dans votre navigateur et ne nécessite aucune installation.

## Prérequis

### Matériel
- Imprimante d'étiquettes Niimbot D110A
- Ordinateur ou smartphone avec Bluetooth activé
- Rouleau d'étiquettes de 15mm compatible Niimbot

### Logiciel
- **Navigateur recommandé** : Chrome, Edge ou Opera (support Web Bluetooth)
- **Système d'exploitation** : Windows, Mac, Linux, Android
- **Note** : Safari (iOS) ne supporte pas Web Bluetooth actuellement

## Configuration initiale

### 1. Préparation de l'imprimante
1. Assurez-vous que votre Niimbot D110A est chargée (voyant bleu clignotant lentement)
2. Installez un rouleau d'étiquettes de 15mm dans l'imprimante
3. Allumez l'imprimante en maintenant le bouton d'alimentation 3-5 secondes
4. Activez le Bluetooth sur votre appareil

### 2. Activation des fonctionnalités du navigateur
Pour Chrome/Edge, vous devrez peut-être activer les fonctionnalités expérimentales :
1. Ouvrez `chrome://flags/` dans votre navigateur
2. Recherchez "Experimental Web Platform Features"
3. Activez cette option
4. Redémarrez le navigateur

## Utilisation de l'application

### Étape 1 : Génération du QR Code
1. **Ouvrez l'application** dans votre navigateur
2. **Saisissez votre URL** dans le champ de texte (ex: https://www.example.com)
3. **Cliquez sur "Générer QR Code"**
4. **Vérifiez l'aperçu** : le QR code et l'URL apparaissent dans la section aperçu

### Étape 2 : Connexion à l'imprimante
1. **Cliquez sur "Connecter l'imprimante"**
2. **Sélectionnez votre Niimbot D110A** dans la liste des appareils Bluetooth
3. **Attendez la confirmation** : le statut passe au vert "Connecté"
4. Le nom de votre imprimante apparaît dans l'interface

### Étape 3 : Configuration d'impression
1. **Densité d'impression** : Choisissez de 1 (léger) à 5 (foncé) - recommandé : 3
2. **Nombre de copies** : Sélectionnez de 1 à 10 étiquettes
3. **Prévisualisez** l'étiquette finale dans la section aperçu

### Étape 4 : Impression
1. **Cliquez sur "Imprimer étiquette"**
2. **Attendez le traitement** : l'application convertit l'image pour l'imprimante
3. **Vérifiez l'impression** : l'étiquette sort automatiquement de l'imprimante

## Spécifications techniques

### Format des étiquettes
- **Largeur maximale** : 15mm (contrainte du D110A)
- **Hauteur** : Variable selon la longueur de l'URL
- **Résolution** : 203 DPI
- **Composition** :
  - QR code centré en haut
  - URL en texte lisible en bas
  - Retour à la ligne automatique si nécessaire

### Connectivité Bluetooth
- **Protocol** : Bluetooth 4.0 (BLE)
- **Portée** : Jusqu'à 10 mètres (recommandé : 3-4 mètres)
- **Connexion** : Via Web Bluetooth API
- **Sécurité** : Connexion chiffrée standard Bluetooth

## Dépannage

### Problèmes de connexion Bluetooth

**L'imprimante n'apparaît pas dans la liste**
- Vérifiez que l'imprimante est allumée (voyant bleu)
- Assurez-vous qu'elle n'est pas déjà connectée à un autre appareil
- Redémarrez le Bluetooth sur votre appareil
- Rapprochez-vous de l'imprimante

**Échec de connexion**
- Éteignez et rallumez l'imprimante
- Effacez le cache de votre navigateur
- Vérifiez que Web Bluetooth est activé dans les paramètres

### Problèmes d'impression

**L'impression est trop claire**
- Augmentez la densité d'impression (valeur 4 ou 5)
- Vérifiez que le rouleau d'étiquettes est bien installé
- Assurez-vous que l'imprimante est suffisamment chargée

**L'impression est coupée**
- Vérifiez que l'URL n'est pas trop longue
- Utilisez des URLs courtes ou des raccourcisseurs d'URL

**Rien ne s'imprime**
- Vérifiez la connexion Bluetooth
- Assurez-vous qu'il y a du papier dans l'imprimante
- Redémarrez l'application et reconnectez l'imprimante

### Problèmes de QR Code

**Le QR code ne se génère pas**
- Vérifiez que l'URL est valide (doit commencer par http:// ou https://)
- Évitez les caractères spéciaux dans l'URL
- Testez avec une URL simple d'abord

**Le QR code ne fonctionne pas**
- Testez le QR code avec l'appareil photo de votre téléphone
- Assurez-vous que l'URL est accessible
- Vérifiez que l'impression est nette et contrastée

## Conseils d'utilisation

### Pour de meilleurs résultats
1. **URLs courtes** : Privilégiez des URLs courtes pour une meilleure lisibilité
2. **Test préalable** : Testez toujours le QR code avant impression massive
3. **Qualité d'impression** : Utilisez une densité 3-4 pour un bon contraste
4. **Stockage des étiquettes** : Les étiquettes thermiques peuvent s'effacer avec la chaleur

### Optimisation de l'autonomie
- Éteignez l'imprimante après utilisation
- Déconnectez le Bluetooth quand non utilisé
- Rechargez régulièrement l'imprimante

## Support et maintenance

### Nettoyage de l'imprimante
- Nettoyez la tête d'impression avec un coton-tige et de l'alcool isopropylique
- Évitez de toucher les composants électroniques
- Nettoyez régulièrement pour maintenir la qualité d'impression

### Mise à jour
- L'application se met à jour automatiquement
- Actualisez la page pour obtenir la dernière version
- Vérifiez régulièrement les mises à jour du navigateur

## Limitations techniques

### Navigateurs non supportés
- Safari sur iOS (pas de support Web Bluetooth)
- Navigateurs anciens (< 2019)
- Certains navigateurs mobiles alternatifs

### Contraintes d'impression
- Largeur limitée à 15mm (spécification D110A)
- Impression en noir et blanc uniquement
- Pas de couleurs ou niveaux de gris

### Portée Bluetooth
- Distance maximale : 10 mètres
- Obstacles peuvent réduire la portée
- Interférences possibles avec d'autres appareils

## Ressources additionnelles

### Documentation officielle Niimbot
- Manuel utilisateur D110A
- Application mobile Niimbot (alternative)
- Support technique Niimbot

### Développement et personnalisation
- Code source disponible pour modifications
- API Web Bluetooth pour développeurs
- Bibliothèque QRCode.js pour génération

---

**Version du guide** : 1.0  
**Dernière mise à jour** : Juillet 2025  
**Compatibilité** : Niimbot D110A uniquement