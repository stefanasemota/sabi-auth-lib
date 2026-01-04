'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.SabiAuthProvider = void 0;
var react_1 = require("react");
var app_1 = require("firebase/app");
var auth_1 = require("firebase/auth");
var AuthContext = (0, react_1.createContext)(undefined);
var SabiAuthProvider = function (_a) {
    var children = _a.children, firebaseConfig = _a.firebaseConfig;
    var _b = (0, react_1.useState)(null), user = _b[0], setUser = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    // Initialize Firebase Client
    var app = (0, app_1.getApps)().length === 0 ? (0, app_1.initializeApp)(firebaseConfig) : (0, app_1.getApps)()[0];
    var auth = (0, auth_1.getAuth)(app);
    (0, react_1.useEffect)(function () {
        var unsubscribe = (0, auth_1.onAuthStateChanged)(auth, function (u) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                setUser(u);
                setLoading(false);
                // Ensure we are in the browser before touching document
                if (typeof window !== 'undefined') {
                    if (u) {
                        document.cookie = "__session=".concat(u.uid, "; path=/; max-age=604800; SameSite=Lax;");
                    }
                    else {
                        document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
                    }
                }
                return [2 /*return*/];
            });
        }); });
        return function () { return unsubscribe(); };
    }, [auth]);
    var login = function () { return __awaiter(void 0, void 0, void 0, function () {
        var provider;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = new auth_1.GoogleAuthProvider();
                    return [4 /*yield*/, (0, auth_1.signInWithPopup)(auth, provider)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var logout = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.signOut)(auth)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return (<AuthContext.Provider value={{ user: user, loading: loading, login: login, logout: logout }}>
      {children}
    </AuthContext.Provider>);
};
exports.SabiAuthProvider = SabiAuthProvider;
var useAuth = function () {
    var context = (0, react_1.useContext)(AuthContext);
    if (!context)
        throw new Error('useAuth must be used within SabiAuthProvider');
    return context;
};
exports.useAuth = useAuth;
