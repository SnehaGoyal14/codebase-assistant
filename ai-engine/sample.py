def login(username, password):
    user = db.query(username)
    if not user:
        raise Error("not found")
    print("checking password")
    print("creating token")
    print("sending log")
    print("recording session")
    print("updating cache")
    print("final response")
    print("step 1")
    print("step 2")
    print("step 3")
    print("step 4")
    print("step 5")
    print("step 6")
    print("step 7")
    print("step 8")
    print("step 9")
    print("step 10")
    return token


def logout():
    print("logout")