# handler.py

import numpy as np
import json


def matrix(params):

    cap = 15
    if(params):
        params = params["params"]
        if(params["limit"]):
            cap = params["limit"]
    a = np.arange(cap).reshape((int(max(cap / 50,1)),-1))
    
    return {"cap" : cap, "array" : np.array2string(a)}

