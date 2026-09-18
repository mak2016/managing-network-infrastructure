# Food ordering app

A small ordering app for a single food business — customers browse a menu, add
items to a cart, check out with pickup/delivery details, and track their order
status. You (the owner) get a password-protected dashboard to manage incoming
orders and edit the menu.

- **Customer app**: menu, cart, checkout, order tracking, "my orders"
- **Admin dashboard**: live order queue with status updates, menu CRUD, store
  settings (open/closed, delivery fee, minimum order, contact info)
- **Payment**: cash / pay-on-delivery-or-pickup — there's no payment gateway
  built in, you settle up with the customer directly
- **Stack**: React + Vite, Firebase (Firestore for data, Auth for your admin
  login). No custom backend server to run or pay for.

## 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and
   create a new project (the free "Spark" plan is enough for this app).
2. **Add a web app** (the `</>` icon on the project overview page). Firebase
   will show you a `firebaseConfig` object — you'll need those values in step
   4.
3. **Firestore**: in the left sidebar, go to *Build → Firestore Database →
   Create database*. Start in production mode (the security rules below lock
   it down) and pick a region close to your customers.
4. **Authentication**: go to *Build → Authentication → Get started*, enable
   the **Email/Password** sign-in provider, then go to the *Users* tab and
   add one user — this is your admin login (e.g. `you@yourbusiness.com` plus a
   password). There's no public sign-up screen in the app on purpose: the
   only way to get an admin account is to create it here yourself.
5. **Security rules**: in *Firestore Database → Rules*, replace the default
   rules with the contents of [`firestore.rules`](./firestore.rules) from
   this folder, then publish. This is what makes the menu/settings public
   read-only, orders creatable by anyone but only listable/editable by your
   signed-in admin account, and prevents random writes.

## 2. Configure the app

```bash
cd food-app
cp .env.example .env
```

Fill in `.env` with the `firebaseConfig` values from step 1.2 (apiKey,
authDomain, projectId, storageBucket, messagingSenderId, appId).

## 3. Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL. The menu will be empty at first — sign in at
`#/admin/login` with the admin user you created, then add a few items under
*Menu*, and flip *Settings → Open for orders* on.

### Optional: run against the Firebase Emulator Suite instead

If you'd rather not touch a live project while developing, you can run
against the local [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite):

```bash
npx firebase-tools emulators:start --only firestore,auth --project demo-food-app
```

Then set `VITE_FIREBASE_CONFIG={"apiKey":"demo","projectId":"demo-food-app","appId":"demo"}`
and `VITE_USE_FIREBASE_EMULATOR=true` in `.env` and run `npm run dev`. The
emulator UI (printed in the terminal) lets you create a test admin user under
Auth without touching a real Firebase project.

## 4. Menu item images

There's no image upload built in (Firebase Storage requires a billing
account on new projects, which felt like overkill for a small menu). Instead,
paste a public image URL when editing a menu item — e.g. upload the photo to
any free image host, or use a link to an existing photo. Leave it blank and
the item just shows without a picture.

## 5. Deploy

This app is a static site (Vite build output) — it doesn't need a server. It
lives inside a repo that already deploys another project to GitHub Pages
under the same site, so see the root [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml)
workflow: it builds `food-app` and publishes it under `/food-app/` on the
same Pages site, alongside the other app at the site root.

To have the deployed build carry your Firebase config, add a repository
secret named `FOOD_APP_FIREBASE_CONFIG` containing the `firebaseConfig`
object as one line of JSON, e.g.:

```json
{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}
```

(Settings → Secrets and variables → Actions → New repository secret, in your
GitHub repo.) The workflow passes it through as `VITE_FIREBASE_CONFIG` at
build time.

You can also deploy `food-app/dist` (after `npm run build`) to any other
static host (Netlify, Vercel, Firebase Hosting, etc.) if you'd rather not use
GitHub Pages — just remember to set the same env vars at build time there.

## Notes on scope

This intentionally is not a multi-restaurant marketplace like Foodpanda or
Just Eat — it's a single-business ordering app with the parts of that
experience that actually matter for a small business: a real menu, a cart,
checkout, live order tracking, and an owner dashboard. Things it does *not*
do: driver dispatch/logistics, online payment processing, multi-vendor
support, or customer accounts/login (orders are tracked by link/order ID
instead, no signup required to order).
