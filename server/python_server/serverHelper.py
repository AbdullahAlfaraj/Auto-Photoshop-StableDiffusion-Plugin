import time
import os
import datetime
import uuid
import json

# this function should be used whenever we need to write to json file
def writeJson(file_name,data_dict):
    with open(file_name, 'w', encoding='utf-8') as outfile:
        json.dump(data_dict, outfile, ensure_ascii=False, indent=4)
        
    
    

# this function should be used whenever we need to read from json file
def readJson(file_name): 
    data_dict = {}
    try:
        with open(file_name) as f_obj:
            data_dict = json.load(f_obj)
            
            print("readJson: data_dict: ", data_dict)
    except IOError:
        print(f"{file_name} is not found")
    return data_dict

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

#create string dir path name based on the uniqueDocumentId
def getUniqueDocumentDirPathName(uniqueDocumentId):
    
    currentDirPath = os.getcwd()
    output_path = os.path.join(currentDirPath,"output")
    fullpath = os.path.join(output_path,uniqueDocumentId)

    return fullpath,uniqueDocumentId

def makeUniqueID():
    myuuid = uuid.uuid4()
    print('Your UUID is: ' + str(myuuid))
    return myuuid


if __name__ == "__main__":
    # currentDirPath = os.getcwd()
    # dirName = f'{time.time()}'
    # fullpath = os.path.join(currentDirPath,dirName)
    # createFolder(fullpath)
    id = makeUniqueID()
    print("id: ",id)