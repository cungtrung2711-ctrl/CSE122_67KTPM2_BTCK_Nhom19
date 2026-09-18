#include<bits/stdc++.h>
using namespace std;
int main(){
    string a;
    getline(cin,a);
    for(int i=0;i<a.size();i++){
        if(a[i]>='a'&&a[i]<='z'){
            cout<<char((a[i] - 'a' + 3)%26 + 'a');
        }
        else if(a[i]>='A'&&a[i]<='Z'){
            cout<<char((a[i] - 'A' + 3)%26 + 'A');
        }
        else if(a[i]>='0'&&a[i]<='9'){
            cout<<((a[i]-'!'-16)%10+'!');
        }
    }
    return 0;
}