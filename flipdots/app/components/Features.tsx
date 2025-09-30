export default function Features() {
  const features = [
    {
      title: "1: Data Sources",
      description:
        "Live inputs like weather, music, or mini-games provide dynamic content. Each data source connects to a widget that transforms abstract information into visuals.",
      icon: "⚙️",
    },
    {
      title: "2. Widgets in the 3D Room",
      description:
        "The system places these widgets as digital paintings inside a 3D room. The room is a gallery — each wall can showcase different interactive experiences, from a Spotify album art to a real-time weather mural.",
      icon: "👁️",
    },
    {
      title: "3. Rendering Frames",
      description:
        "The gallery is continuously rendered into frames of dot patterns. These frames translate the 3D space into a low-resolution pixel grid matching the flipdot display.",
      icon: "🔋",
    },
    {
      title: "4. Flipdot Controller",
      description:
        "Each frame is sent to the controller, which uses electromagnets to physically flip dots on the flipdot wall, updating in real time.",
      icon: "🔋",
    },
    {
      title: "5. Physical Display",
      description:
        "The virtual paintings in the room become tangible dot-based visuals on the flipdot installation — bridging digital imagination with physical interaction.",
      icon: "🔋",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 flex justify-start">
          <div className="inline-block bg-black py-6 px-8 rounded-lg">
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white">
              HOW IT WORKS?
            </h2>
          </div>
        </div>

        {/* Features Grid - Uniform Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white p-8 rounded-2xl border-2 border-black/20 shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary overflow-hidden h-full flex flex-col"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-300 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-black/5 rounded-xl mb-6 transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-110">
                  <span className="text-4xl">{feature.icon}</span>
                </div>
                
                <h3 className="font-heading text-xl font-bold mb-4 text-black group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="font-body text-sm leading-relaxed text-black/70 flex-grow">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
