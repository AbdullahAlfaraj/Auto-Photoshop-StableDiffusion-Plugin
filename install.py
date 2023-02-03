import launch

print("Auto-Photoshop-SD plugin is installing")
if not launch.is_installed("duckduckgo_search"):
    launch.run_pip("install duckduckgo_search==2.8.0", "requirements for Auto-Photoshop Image Search")
    