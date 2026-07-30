import { ArrowLeft } from "lucide-react";
import { Logo } from "../components/Logo";
import { homeUrl } from "../config";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <Logo />
      <p className="section-kicker">Erreur 404</p>
      <h1>Cette place n’existe pas.</h1>
      <p>Le lien demandé ne correspond à aucune page Parkventory.</p>
      <a className="button button-primary" href={homeUrl}><ArrowLeft aria-hidden="true" /> Revenir à l’accueil</a>
    </main>
  );
}
