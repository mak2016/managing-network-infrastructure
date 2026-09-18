export default function SetupNotice() {
  return (
    <div className="setup-notice">
      <h1>Almost there</h1>
      <p>
        This app needs a Firebase project before it can show a menu or take orders. Copy{' '}
        <code>.env.example</code> to <code>.env</code>, fill in your Firebase config, and restart
        the dev server.
      </p>
      <p>See the README for the full setup walkthrough (Firestore, Auth, and security rules).</p>
    </div>
  )
}
