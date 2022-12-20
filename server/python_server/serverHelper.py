import time
import os
import datetime
def createFolder(fullpath):
    print("fullpath:",fullpath)
    
    if not os.path.exists(fullpath):
        os.mkdir(fullpath)
#create string dir path name based on the current time
def makeDirPathName():
    # dirName = f'{time.time()}'
    currentDirPath = os.getcwd()
    now = datetime.datetime.now()
    daily_folder = now.strftime("%Y-%m-%d")
    output_path = os.path.join(currentDirPath,"output")
    fullpath = os.path.join(output_path,daily_folder)
    # fullpath = os.path.join(currentDirPath,dirName)
    return fullpath,daily_folder
if __name__ == "__main__":
    currentDirPath = os.getcwd()
    dirName = f'{time.time()}'
    fullpath = os.path.join(currentDirPath,dirName)
    createFolder(fullpath)

