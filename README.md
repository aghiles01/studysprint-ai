# StudySprint AI

StudySprint AI est un prototype de solution digitale éducative qui aide les étudiants à transformer des notes de cours en plan de révision exploitable.

## Problème
De nombreux étudiants arrivent à la période d'examen avec des notes longues, désorganisées et difficiles à prioriser.

## Solution
L'application permet de :
- saisir ou coller des notes de cours ;
- choisir un objectif (examen, résumé, oral) ;
- générer un résumé, des priorités et un mini quiz ;
- consulter un historique local des sessions générées.

## Interactions principales
1. Saisie de contenu + génération d'un résultat.
2. Consultation et gestion de l'historique.

## Stack technique
- HTML / CSS / JavaScript vanilla
- Stockage local via `localStorage`
- Déploiement statique compatible Vercel

## Installation locale
### Option 1 - serveur Python
```bash
python3 -m http.server 8000
```
Puis ouvrir `http://localhost:8000`

### Option 2 - extension Live Server
Ouvrir le dossier dans VS Code puis lancer Live Server.

## Déploiement public
L’application est accessible publiquement à l’adresse suivante :

### Lien Public
https://aghiles01.github.io/studysprint-ai/

## Structure du projet
- `index.html` : interface principale
- `styles.css` : design UI
- `script.js` : logique de génération et historique
- `vercel.json` : configuration de déploiement statique

## Modes d'usage
- **Utilisateur étudiant** : crée une session de révision.
- **Évaluateur / enseignant** : peut tester le flux principal en lançant une génération avec l'exemple intégré.

## Validation de l'idée
L'idée a été affinée avec des prompts structurés pour :
- préciser le persona cible ;
- simplifier le MVP ;
- identifier les bénéfices clés ;
- vérifier la cohérence entre problème, solution et démonstration.

## Usage de l'IA
- **Idéation / validation** : prompts de cadrage produit.
- **Application** : la génération est simulée par une logique locale heuristique afin de garantir une démonstration fonctionnelle sans dépendance API.
- **Lovable.dev** : non utilisé dans cette version.

## Répartition des tâches
Projet prévu pour un rendu individuel, mais facilement adaptable en binôme.
