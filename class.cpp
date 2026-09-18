#include <bits/stdc++.h>
using namespace std;

class Sinhvien {
    private:
        int MSV;
        string HoTen;
        float DiemGiuaKy;
        float DiemCuoiKy;

    public:
        int getMSV() {
            return MSV;
        }

        string getHoTen() {
            return HoTen;
        }
        void setDiemGiuaKy(float DiemGiuaKy) {
            this->DiemGiuaKy = DiemGiuaKy;
        }

        float getDiemGiuaKy() {
            return DiemGiuaKy;
        }

        void setDiemCuoiKy(float DiemCuoiKy) {
            this->DiemCuoiKy = DiemCuoiKy;
        }

        float getDiemCuoiKy() {
            return DiemCuoiKy;
        }

        void input() {
            cin >> MSV;
            cin.ignore(); 
            getline(cin, HoTen);
            cin >> DiemGiuaKy;
            cin >> DiemCuoiKy;
        }

        void output() {
            cout << MSV << "-" << HoTen << "-" << DiemGiuaKy << "-" << DiemCuoiKy << endl;
        }
        
        float tinhDiem() {
            return 0.5f * DiemGiuaKy + 0.5f * DiemCuoiKy;
        }
        void inThongTinNgan() {
            cout << MSV << "-" << HoTen;
        }
};

int main() {
    int n;
    if (!(cin >> n) || n <= 0) {
        return 0;
    }
    vector<Sinhvien> ds(n);
    for (int i = 0; i < n; ++i) {
        ds[i].input();
    }
    
    cout << "ds sinh vien:" << endl;
    for (int i = 0; i < n; ++i) {
        ds[i].output();
    }

    int viTriMax = 0;
    float diemCaoNhat = ds[0].tinhDiem();

    for (int i = 1; i < n; ++i) {
        float diemHienTai = ds[i].tinhDiem();
        if (diemHienTai > diemCaoNhat) {
            diemCaoNhat = diemHienTai;
            viTriMax = i;
        }
    }
    cout << "max sinh vien: " << ds[viTriMax].getMSV() << "-" << ds[viTriMax].getHoTen() << endl;
    
    return 0;
}
