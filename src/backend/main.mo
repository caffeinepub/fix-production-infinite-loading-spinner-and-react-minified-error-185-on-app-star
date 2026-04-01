import Map "mo:core/Map";
import Text "mo:core/Text";
import Int "mo:core/Int";
import List "mo:core/List";
import Char "mo:core/Char";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Timestamp "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";

actor {
  public type Transaction = {
    id : Nat;
    owner : Principal;
    amount : Int;
    description : Text;
    date : Text;
    category : Category;
  };

  // V1 types kept for stable migration (before cash2 was added)
  public type CategoryV1 = {
    #cash;
    #card;
    #food;
    #drinks;
    #wages;
    #rent;
    #utilities;
    #other;
  };

  public type TransactionV1 = {
    id : Nat;
    owner : Principal;
    amount : Int;
    description : Text;
    date : Text;
    category : CategoryV1;
  };

  public type Category = {
    #cash;
    #cash2;
    #card;
    #food;
    #drinks;
    #wages;
    #rent;
    #utilities;
    #other;
  };

  public type ExpenseBreakdown = {
    food : Int;
    drinks : Int;
    wages : Int;
    rent : Int;
    utilities : Int;
    other : Int;
  };

  public type IncomeBreakdown = {
    cash : Int;
    cash2 : Int;
    card : Int;
  };

  public type MonthlyStats = {
    totalIncome : Int;
    totalExpenses : Int;
    netProfit : Int;
    expensesByCategory : ExpenseBreakdown;
    incomeByCategory : IncomeBreakdown;
  };

  public type UserProfile = {
    name : Text;
    restaurantName : Text;
  };

  public type DiagnosticsStats = {
    totalTransactions : Nat;
    totalUserProfiles : Nat;
    nextTransactionId : Nat;
  };

  public type AdminAuthStatus = {
    isAuthenticated : Bool;
    principal : Principal;
    principalText : Text;
  };

  let accessControlState = AccessControl.initState();
  var adminClaimed : Bool = true; // Never ever set to false in migration! Wrongly set is never again fixable at runtime in the prod/live canister!
  var adminBootstrapSecret : Text = "CHANGE_ME_ON_FIRST_DEPLOY";
  var nextTransactionId = 0;

  // V1: receives old stable data from pre-cash2 deployments
  let transactions = Map.empty<Nat, TransactionV1>();
  // V2: holds migrated + new transactions with updated Category type
  let transactionsV2 = Map.empty<Nat, Transaction>();
  var cash2MigrationDone : Bool = false;
  let userProfiles = Map.empty<Principal, UserProfile>();

  type MigrationState = {
    legacyScalingApplied : Bool;
    legacyCutoffId : Nat;
  };

  let migrationState : MigrationState = {
    legacyScalingApplied = false;
    legacyCutoffId = 0;
  };

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // GET CALLER PRINCIPAL AS TEXT
  public query ({ caller }) func getCallerPrincipalAsText() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access principal information");
    };
    caller.toText();
  };

  public query ({ caller }) func getAdminAuthStatus() : async AdminAuthStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access authentication status");
    };
    {
      isAuthenticated = AccessControl.isAdmin(accessControlState, caller);
      principal = caller;
      principalText = caller.toText();
    };
  };

  // Diagnostics API (Aggregate Metadata Only)
  public query ({ caller }) func getDiagnosticsStats() : async DiagnosticsStats {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can access diagnostics");
    };
    {
      totalTransactions = transactionsV2.size();
      totalUserProfiles = userProfiles.size();
      nextTransactionId;
    };
  };

  public query ({ caller }) func getLegacyScalingDiagnostics() : async MigrationState {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admin can access scaling diagnostics");
    };
    migrationState;
  };

  module Transaction {
    public func compare(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Nat.compare(transaction1.id, transaction2.id);
    };
  };

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Transaction CRUD
  public shared ({ caller }) func addTransaction(amount : Int, description : Text, date : Text, category : Category) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transactions");
    };
    let id = nextTransactionId;
    let transaction : Transaction = {
      id;
      owner = caller;
      amount;
      description;
      date;
      category;
    };
    transactionsV2.add(id, transaction);
    nextTransactionId += 1;
    id;
  };

  public shared ({ caller }) func editTransaction(id : Nat, amount : Int, description : Text, date : Text, category : Category) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit transactions");
    };
    switch (transactionsV2.get(id)) {
      case (null) {
        Runtime.trap("Transaction not found");
      };
      case (?existingTransaction) {
        if (existingTransaction.owner != caller) {
          Runtime.trap("Unauthorized: Can only edit your own transactions");
        };
        let updatedTransaction : Transaction = {
          id;
          owner = caller;
          amount;
          description;
          date;
          category;
        };
        transactionsV2.add(id, updatedTransaction);
      };
    };
  };

  public shared ({ caller }) func deleteTransaction(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete transactions");
    };
    switch (transactionsV2.get(id)) {
      case (null) {
        Runtime.trap("Transaction not found");
      };
      case (?existingTransaction) {
        if (existingTransaction.owner != caller) {
          Runtime.trap("Unauthorized: Can only delete your own transactions");
        };
        transactionsV2.remove(id);
      };
    };
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    transactionsV2.values().toArray().filter(
      func(transaction) {
        transaction.owner == caller;
      }
    );
  };

  public query ({ caller }) func getTransactionsByCategory(category : Category) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    transactionsV2.values().toArray().filter(
      func(transaction) {
        transaction.owner == caller and transaction.category == category;
      }
    );
  };

  // Statistics
  public query ({ caller }) func getCurrentMonthStats() : async MonthlyStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view statistics");
    };

    let now = Time.now();
    let currentMonth = getMonthFromTime(now);
    let currentYear = getYearFromTime(now);

    var totalIncome : Int = 0;
    var totalExpenses : Int = 0;

    var cashTotal : Int = 0;
    var cash2Total : Int = 0;
    var cardTotal : Int = 0;

    var foodTotal : Int = 0;
    var drinksTotal : Int = 0;
    var wagesTotal : Int = 0;
    var rentTotal : Int = 0;
    var utilitiesTotal : Int = 0;
    var otherTotal : Int = 0;

    for (transaction in transactionsV2.values()) {
      if (transaction.owner == caller) {
        switch (parseISO8601YearMonth(transaction.date)) {
          case (?{ year; month }) {
            if (month == currentMonth and year == currentYear) {
              switch (transaction.category) {
                case (#cash) {
                  totalIncome += transaction.amount;
                  cashTotal += transaction.amount;
                };
                case (#cash2) {
                  totalIncome += transaction.amount;
                  cash2Total += transaction.amount;
                };
                case (#card) {
                  totalIncome += transaction.amount;
                  cardTotal += transaction.amount;
                };
                case (#food) {
                  totalExpenses += transaction.amount;
                  foodTotal += transaction.amount;
                };
                case (#drinks) {
                  totalExpenses += transaction.amount;
                  drinksTotal += transaction.amount;
                };
                case (#wages) {
                  totalExpenses += transaction.amount;
                  wagesTotal += transaction.amount;
                };
                case (#rent) {
                  totalExpenses += transaction.amount;
                  rentTotal += transaction.amount;
                };
                case (#utilities) {
                  totalExpenses += transaction.amount;
                  utilitiesTotal += transaction.amount;
                };
                case (#other) {
                  totalExpenses += transaction.amount;
                  otherTotal += transaction.amount;
                };
              };
            };
          };
          case (null) {};
        };
      };
    };

    let expenseBreakdown : ExpenseBreakdown = {
      food = foodTotal;
      drinks = drinksTotal;
      wages = wagesTotal;
      rent = rentTotal;
      utilities = utilitiesTotal;
      other = otherTotal;
    };

    let incomeBreakdown : IncomeBreakdown = {
      cash = cashTotal;
      cash2 = cash2Total;
      card = cardTotal;
    };

    {
      totalIncome;
      totalExpenses;
      netProfit = totalIncome - totalExpenses;
      expensesByCategory = expenseBreakdown;
      incomeByCategory = incomeBreakdown;
    };
  };

  func getMonthFromTime(t : Time.Time) : Nat {
    let currentTimeMillis = t / 1_000_000;
    let seconds = currentTimeMillis / 1000;
    let days = seconds / (60 * 60 * 24);

    var year = 1970;
    var daysRemaining = days;

    let daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    func isLeapYear(year : Int) : Bool {
      if (year % 4 == 0 and year % 100 != 0) { return true };
      year % 400 == 0;
    };

    func getDaysInMonth(month : Int, year : Int) : Int {
      if (month == 2 and isLeapYear(year)) { return 29 };
      daysInMonths[Int.abs(month - 1)];
    };

    while (daysRemaining >= 365) {
      if (isLeapYear(year)) {
        if (daysRemaining >= 366) {
          daysRemaining -= 366;
          year += 1;
        } else {
          if (daysRemaining >= 60) { daysRemaining -= 1 };
          return 1;
        };
      } else {
        daysRemaining -= 365;
        year += 1;
      };
    };

    var month : Int = 1;
    while (month <= 12 and daysRemaining >= getDaysInMonth(month, year)) {
      daysRemaining -= getDaysInMonth(month, year);
      month += 1;
    };
    Int.abs(month);
  };

  func getYearFromTime(t : Time.Time) : Nat {
    let currentTimeMillis = t / 1_000_000;
    let seconds = currentTimeMillis / 1000;
    let days = seconds / (60 * 60 * 24);

    var year = 1970;
    var daysRemaining = days;

    while (daysRemaining >= 365) {
      if (Int.abs(year - 1972) % 4 == 0) {
        if (daysRemaining >= 366) {
          daysRemaining -= 366;
          year += 1;
        } else {
          if (daysRemaining >= 59) {
            daysRemaining -= 1;
          };
          return Int.abs(year);
        };
      } else {
        daysRemaining -= 365;
        year += 1;
      };
    };
    Int.abs(year);
  };

  func parseISO8601YearMonth(isoDate : Text) : ?{ year : Nat; month : Nat } {
    let chars = isoDate.toArray();
    if (chars.size() < 7) { return null };

    let yearChars = chars.sliceToArray(0, 4);
    let monthChars = chars.sliceToArray(5, 7);

    let parseNatFromDigits = func(digitChars : [Char]) : ?Nat {
      if (digitChars.size() == 0) { return null };
      let textVal = Text.fromIter(digitChars.values());
      textVal.toNat();
    };

    switch (parseNatFromDigits(yearChars)) {
      case (?year) {
        switch (parseNatFromDigits(monthChars)) {
          case (?month) {
            ?{ year; month };
          };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };
  // Migrate CategoryV1 to Category (adds #cash2 support)
  func migrateCategoryV1(c : CategoryV1) : Category {
    switch (c) {
      case (#cash) { #cash };
      case (#card) { #card };
      case (#food) { #food };
      case (#drinks) { #drinks };
      case (#wages) { #wages };
      case (#rent) { #rent };
      case (#utilities) { #utilities };
      case (#other) { #other };
    };
  };

  // Run once after upgrade: copy old transactions into transactionsV2 with new Category type
  system func postupgrade() {
    if (not cash2MigrationDone) {
      for ((id, txn) in transactions.entries()) {
        let newTxn : Transaction = {
          id = txn.id;
          owner = txn.owner;
          amount = txn.amount;
          description = txn.description;
          date = txn.date;
          category = migrateCategoryV1(txn.category);
        };
        transactionsV2.add(id, newTxn);
      };
      cash2MigrationDone := true;
    };
  };


};
