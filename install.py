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
extension_branch = "master"
# extension_branch = "horde_native"
# extension_branch = "auto_extension_ccx_1_1_7"

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

package_name = 'duckduckgo_search'
package_version= '3.7.1'
if not launch.is_installed(package_name):
    launch.run_pip(f"install {package_name}=={package_version}", "requirements for Auto-Photoshop Image Search")
else:# it's installed but we need to check for update
    import pkg_resources

    version = pkg_resources.get_distribution(package_name).version
    if(version != package_version):
        print(f'{package_name} version: {version} will update to version: {package_version}')
        launch.run_pip(f"install {package_name}=={package_version}", "update requirements for Auto-Photoshop Image Search")
