# handler.py

import numpy as np
import json


def matrix(params):

    cap = 15
    print(params["params"].keys())
    print(json.loads(params["params"]))
    #if(params["params"]["limit"]):
    #    cap = params["params"]["limit"]
    a = np.arange(cap).reshape((int(max(cap / 50,1)),-1))
    
    return {"cap" : cap, "array" : np.array2string(a)}





print(matrix({"limit":10}))
