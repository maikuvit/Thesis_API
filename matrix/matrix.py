# handler.py

import numpy as np
import json


def matrix(params):
    print params
    cap = params["limit"]
    if(cap is not None):
        cap = 1000
    a = np.arange(cap).reshape((int(cap / 50),-1))
    
    return {"array" : np.array2string(a)}

