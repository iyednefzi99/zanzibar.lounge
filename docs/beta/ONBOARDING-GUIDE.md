# Guide Beta — Zanzibar.lounge

## Bienvenue dans la Beta !

Merci de faire partie des premiers restaurants à utiliser Zanzibar.lounge. Ce guide vous accompagne étape par étape pour configurer votre restaurant et commencer à recevoir des réservations en ligne.

---

## Étape 1 : Créer votre compte (5 minutes)

### Accédez à la plateforme
1. Ouvrez votre navigateur sur : `https://zanzibar-lounge.vercel.app/fr`
2. Cliquez sur "Réserver une démo" ou accédez directement à `/fr/reserver`

### Informations du restaurant
Remplissez le formulaire d'onboarding :
- **Nom du restaurant** : Tel qu'il apparaîtra pour vos clients
- **Adresse** : Adresse complète avec ville
- **Téléphone** : Numéro WhatsApp Business (pour le concierge IA)
- **Email** : Email du gérant principal
- **Type** : Restaurant, Café, Lounge, Pizzeria, etc.
- **Capacité** : Nombre total de couverts

---

## Étape 2 : Configurer votre menu (10 minutes)

### Ajouter les catégories
Exemples :
- Entrées / appetizers
- Plats principaux / main courses
- Desserts
- Boissons / drinks

### Ajouter les plats
Pour chaque plat :
1. Nom du plat (FR + AR recommandé)
2. Prix en DT
3. Description courte
4. Photo (optionnel mais recommandé)
5. Tags : végétarien, épicé, sans gluten, etc.

### Menu du jour
Configurez les plats du jour qui changent automatiquement :
- Lundi : plat 1
- Mardi : plat 2
- etc.

---

## Étape 3 : Configurer les tables et zones (5 minutes)

### Zones de service
- **Salle intérieure** : tables en intérieur
- **Terrasse** : tables extérieures
- **Bar** : comptoir / hautes tables
- **VIP** : espace privé

### Tables
Pour chaque zone, ajoutez :
- Numéro/nom de la table
- Capacité (2, 4, 6 personnes)
- Zone assignée

---

## Étape 4 : Activer le concierge WhatsApp (10 minutes)

### Prérequis
- Numéro WhatsApp Business
- Compte Meta Business vérifié

### Configuration
1. Allez dans **Paramètres** → **WhatsApp**
2. Entrez vos identifiants Meta :
   - Phone Number ID
   - Access Token
   - Verify Token
   - App Secret
3. Cliquez sur "Tester la connexion"
4. Envoyez un message de test à votre numéro WhatsApp

### Personnaliser l'IA
Le concierge connaît déjà votre menu et vos horaires. Vous pouvez ajouter :
- **Messages d'accueil** personnalisés
- **Réponses aux FAQs** spécifiques (parking, dress code, etc.)
- **Transfert vers le personnel** pour les cas complexes

---

## Étape 5 : Activer la waitlist gamifiée (5 minutes)

### Quand l'activer ?
- Quand votre restaurant est souvent complet aux heures de pointe
- Pour les vendredis et samedis soirs

### Configuration
1. Allez dans **Paramètres** → **Waitlist**
2. Activez "Liste d'attente intelligente"
3. Configurez les récompenses :
   - **15 min d'attente** : 10% de réduction sur la boisson
   - **30 min d'attente** : Dessert offert
   - **45 min d'attente** : -20% sur le total

### Notification
Les clients sont notifiés par WhatsApp quand une table se libère. Ils ont 15 minutes pour confirmer.

---

## Étape 6 : Configurer les notifications (5 minutes)

### Rappels automatiques
- **24h avant** : Rappel de réservation avec détails
- **2h avant** : Dernière vérification

### Confirmations
- **Réservation créée** : Confirmation immédiate
- **Annulation** : Notification d'annulation
- **Modification** : Confirmation du changement

---

## Étape 7 : Tester le flux complet (10 minutes)

### Test en tant que client
1. Ouvrez votre lien de réservation : `https://zanzibar-lounge.vercel.app/fr/reserver`
2. Sélectionnez une date et une heure
3. Choisissez une table
4. Entrez vos informations
5. Confirmez la réservation
6. Vérifiez que vous recevez la confirmation WhatsApp

### Test du concierge
1. Envoyez "Bonjour" à votre numéro WhatsApp
2. Demandez "Avez-vous une table pour 4 ce soir à 20h?"
3. Vérifiez que l'IA répond avec les disponibilités
4. Confirmez la réservation via WhatsApp

---

## Étape 6 : Dashboard admin

### Accès
- URL : `https://zanzibar-lounge.vercel.app/fr/admin`
- Login : votre email + mot de passe

### Pages principales
| Page | Usage |
|------|-------|
| **Dashboard** | Vue d'ensemble : réservations du jour, couverts, revenus |
| **Réservations** | Liste complète, filtres, modification |
| **Menu** | Gestion du menu et des plats |
| **Waitlist** | File d'attente en temps réel |
| **Analytics** | Statistiques : revenus, couverts, taux d'occupation |
| **Paramètres** | Configuration du restaurant |

---

## Support

### Contact
- **WhatsApp** : +216 XX XXX XXX (support prioritaire)
- **Email** : support@zanzibar-lounge.com
- **Réponse** : < 2h pendant les heures ouvrées

### FAQ Rapide

**Q : Puis-je modifier mon menu après l'inscription ?**
Oui, vous pouvez modifier votre menu à tout moment depuis le dashboard admin.

**Q : Comment ajouter un employé ?**
Paramètres → Équipe → Ajouter un membre. Choisissez son rôle (gérant, serveur, cuisinier).

**Q : Que se passe-t-il si WhatsApp est en panne ?**
Le système bascule automatiquement sur SMS (si Twilio est configuré) ou email.

**Q : Comment voir mes statistiques ?**
Dashboard → Analytics. Vous verrez les revenus, couverts, taux d'occupation, et plus.
