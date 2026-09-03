package com.workerledger.app;

import org.json.JSONException;
import org.json.JSONObject;

final class LedgerModels {
    private LedgerModels() {
    }

    static final class Settings {
        long monthlyTakeHomeCents;
        double payMonths = 12;
        double workdaysPerMonth = 21.75;
        double onsiteHoursPerDay = 8;
        double commuteHoursPerDay = 1;
        double overtimeHoursPerMonth;
        long workCostCentsPerMonth;
        long fundGoalCents;
        long fundCurrentCents;
        long updatedAt;
        String salaryEffectiveMonth;

        static Settings defaults() {
            Settings settings = new Settings();
            settings.updatedAt = System.currentTimeMillis();
            return settings;
        }

        static Settings fromJson(JSONObject object) throws JSONException {
            Settings settings = new Settings();
            settings.monthlyTakeHomeCents = safeInteger(object, "monthlyTakeHomeCents");
            settings.payMonths = object.getDouble("payMonths");
            settings.workdaysPerMonth = object.getDouble("workdaysPerMonth");
            settings.onsiteHoursPerDay = object.getDouble("onsiteHoursPerDay");
            settings.commuteHoursPerDay = object.getDouble("commuteHoursPerDay");
            settings.overtimeHoursPerMonth = object.getDouble("overtimeHoursPerMonth");
            settings.workCostCentsPerMonth = safeInteger(object, "workCostCentsPerMonth");
            settings.fundGoalCents = safeInteger(object, "fundGoalCents");
            settings.fundCurrentCents = safeInteger(object, "fundCurrentCents");
            settings.updatedAt = optionalSafeInteger(object, "updatedAt", System.currentTimeMillis());
            if (object.has("salaryEffectiveMonth") && !object.isNull("salaryEffectiveMonth")) {
                settings.salaryEffectiveMonth = object.getString("salaryEffectiveMonth");
            }
            return settings;
        }

        JSONObject toJson() throws JSONException {
            JSONObject object = new JSONObject();
            object.put("monthlyTakeHomeCents", monthlyTakeHomeCents);
            object.put("payMonths", payMonths);
            object.put("workdaysPerMonth", workdaysPerMonth);
            object.put("onsiteHoursPerDay", onsiteHoursPerDay);
            object.put("commuteHoursPerDay", commuteHoursPerDay);
            object.put("overtimeHoursPerMonth", overtimeHoursPerMonth);
            object.put("workCostCentsPerMonth", workCostCentsPerMonth);
            object.put("fundGoalCents", fundGoalCents);
            object.put("fundCurrentCents", fundCurrentCents);
            object.put("updatedAt", updatedAt);
            return object;
        }
    }

    static final class Entry {
        long id;
        String kind;
        long amountCents;
        String category;
        String note;
        String entryDate;
        String expenseType;
        long createdAt;
        long updatedAt;
        Long hourlyRateCentsPerHour;

        static Entry fromJson(JSONObject object) throws JSONException {
            Entry entry = new Entry();
            entry.id = optionalSafeInteger(object, "id", 0);
            entry.kind = object.getString("kind");
            entry.amountCents = safeInteger(object, "amountCents");
            entry.category = object.getString("category");
            entry.note = object.optString("note", "");
            entry.entryDate = object.getString("entryDate");
            entry.expenseType = object.optString("expenseType", "");
            entry.createdAt = optionalSafeInteger(object, "createdAt", System.currentTimeMillis());
            entry.updatedAt = optionalSafeInteger(object, "updatedAt", entry.createdAt);
            if (object.has("hourlyRateCentsPerHour") && !object.isNull("hourlyRateCentsPerHour")) {
                entry.hourlyRateCentsPerHour = safeInteger(object, "hourlyRateCentsPerHour");
            }
            return entry;
        }

        JSONObject toJson() throws JSONException {
            JSONObject object = new JSONObject();
            object.put("id", id);
            object.put("kind", kind);
            object.put("amountCents", amountCents);
            object.put("category", category);
            object.put("note", note == null ? "" : note);
            object.put("entryDate", entryDate);
            object.put("expenseType", expenseType == null ? "" : expenseType);
            object.put("createdAt", createdAt);
            object.put("updatedAt", updatedAt);
            object.put("hourlyRateCentsPerHour", hourlyRateCentsPerHour == null ? JSONObject.NULL : hourlyRateCentsPerHour);
            return object;
        }
    }

    static long safeInteger(JSONObject object, String key) throws JSONException {
        Object value = object.get(key);
        if (!(value instanceof Number)) {
            throw new IllegalArgumentException(key + " 必须是安全整数");
        }
        double number = ((Number) value).doubleValue();
        if (!Double.isFinite(number) || Math.rint(number) != number || number < -9007199254740991d
                || number > 9007199254740991d) {
            throw new IllegalArgumentException(key + " 必须是安全整数");
        }
        return ((Number) value).longValue();
    }

    private static long optionalSafeInteger(JSONObject object, String key, long fallback) throws JSONException {
        return object.has(key) && !object.isNull(key) ? safeInteger(object, key) : fallback;
    }
}
