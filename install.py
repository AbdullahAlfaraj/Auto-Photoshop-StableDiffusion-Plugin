import os
from pathlib import Path
from launch import git, run
import launch
import sys

# launch.run(f'git pull', f"updating auto-photoshop plugin",
#         f"Couldn't update auto-photoshop plugin")


REPO_LOCATION = Path(__file__).parent
# auto_update = os.environ.get("AUTO_UPDATE", "True").lower() in {"true", "yes"}
auto_update = True
extension_branch = "plugin-server-decouple"
if auto_update:
    print("[Auto-Photoshop-SD] Attempting auto-update...")

    try:

        checkout_result = run(f'"{git}" -C "{REPO_LOCATION}" checkout {extension_branch}', "[Auto-Photoshop-SD] switch branch to extension branch.")
        print("checkout_result:",checkout_result)

        branch_result = run(f'"{git}" -C "{REPO_LOCATION}" branch', "[Auto-Photoshop-SD] Current Branch.")
        print("branch_result:",branch_result)
        
        fetch_result = run(f'"{git}" -C "{REPO_LOCATION}" fetch', "[Auto-Photoshop-SD] Fetch upstream.")
        print("fetch_result:",fetch_result)

        pull_result = run(f'"{git}" -C "{REPO_LOCATION}" pull', "[Auto-Photoshop-SD] Pull upstream.")
        print("pull_result:",pull_result)

    except Exception as e:
        print("[Auto-Photoshop-SD] Auto-update failed:")
        print(e)
        print("[Auto-Photoshop-SD] Ensure git was used to install extension.")


# print("Auto-Photoshop-SD plugin is installing")

if not launch.is_installed("duckduckgo_search"):
    launch.run_pip("install duckduckgo_search==2.8.0", "requirements for Auto-Photoshop Image Search")
    