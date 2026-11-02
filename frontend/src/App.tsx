import { CreatorFooter } from "./components/CreatorFooter";
import { EventsSection } from "./components/EventsSection";
import { HeroSection } from "./components/HeroSection";

function App() {
  return (
    <div id="top" className="min-h-screen bg-slate-950">
      <HeroSection />
      <EventsSection />
      <CreatorFooter />
    </div>
  );
}

export default App;
