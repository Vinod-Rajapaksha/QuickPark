class LoginRequest {
  final String email;
  final String password;

  LoginRequest({required this.email, required this.password});

  Map<String, dynamic> toJson() => {
    'email': email.trim().toLowerCase(),
    'password': password,
  };
}

class GoogleLoginRequest {
  final String idToken;

  GoogleLoginRequest({required this.idToken});

  Map<String, dynamic> toJson() => {'idToken': idToken};
}

class RegisterRequest {
  final String fullName;
  final String email;
  final String password;
  final String phone;
  final String nic;
  final String role;

  RegisterRequest({
    required this.fullName,
    required this.email,
    required this.password,
    required this.phone,
    required this.nic,
    this.role = 'DRIVER',
  });

  Map<String, dynamic> toJson() => {
    'fullName': fullName,
    'email': email,
    'password': password,
    'phone': phone,
    'nic': nic,
    'role': role,
  };
}

class User {
  final String id;
  final String fullName;
  final String email;
  final String role;

  User({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    String parsedRole = 'DRIVER';
    if (json['role'] != null) {
      if (json['role'] is String) {
        parsedRole = json['role'].toString().toUpperCase();
      } else if (json['role'] is int) {
        switch (json['role']) {
          case 1: parsedRole = 'PARKING_OWNER'; break;
          case 2: parsedRole = 'PARKING_STAFF'; break;
          case 3: parsedRole = 'PLATFORM_ADMIN'; break;
          case 0: default: parsedRole = 'DRIVER'; break;
        }
      }
    }

    return User(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: parsedRole,
    );
  }
}
