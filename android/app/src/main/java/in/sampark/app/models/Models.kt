package in.sampark.app.models

/**
 * Sampark Verification Architecture
 * Distinct records for Mobile, Location, and Business Proof to ensure trust & authenticity.
 */
enum class VerificationLevel {
    UNVERIFIED,
    MOBILE_VERIFIED,
    LOCATION_VERIFIED,
    BUSINESS_VERIFIED
}

enum class VerificationStatus {
    PENDING,
    VERIFIED,
    REJECTED,
    EXPIRED,
    REVERIFICATION_REQUIRED
}

enum class BusinessType {
    PHYSICAL_STORE,
    MANUFACTURER,
    OFFICE,
    HOME_SERVICE,
    ONLINE
}

enum class DocumentType {
    GSTIN,
    UDYAM_MSME,
    SHOP_ESTABLISHMENT_ACT,
    TRADE_LICENSE,
    PARTNERSHIP_DEED
}

// 1. Mobile Identity Verification (Phone OTP bound to Firebase UID)
data class MobileVerificationRecord(
    val status: VerificationStatus = VerificationStatus.PENDING,
    val phoneNumber: String = "",
    val verifiedAt: Long? = null,
    val method: String = "SMS_OTP",
    val lastCheckedAt: Long = System.currentTimeMillis()
)

// 2. Physical Location Verification (GPS Geolocation + Accuracy Radius)
data class LocationVerificationRecord(
    val status: VerificationStatus = VerificationStatus.PENDING,
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val accuracyMeters: Float = 0f,
    val verifiedAddress: String = "",
    val verificationRadiusMeters: Double = 50.0,
    val verifiedAt: Long? = null,
    val lastCheckedAt: Long = System.currentTimeMillis()
)

// 3. Legal Business Document Verification (GST/MSME/Shop Act)
data class BusinessVerificationRecord(
    val status: VerificationStatus = VerificationStatus.PENDING,
    val documentType: DocumentType? = null,
    val documentNumber: String = "",
    val documentPhotoUrl: String = "",
    val verifiedBy: String = "system_audit",
    val verifiedAt: Long? = null,
    val expiryDate: Long? = null
)

// 4. Periodic Re-verification Schedule (30/60/90 days cycle)
data class ReverificationSchedule(
    val status: VerificationStatus = VerificationStatus.VERIFIED,
    val lastVerifiedAt: Long = System.currentTimeMillis(),
    val nextVerificationAt: Long = System.currentTimeMillis() + (60L * 24 * 60 * 60 * 1000), // 60 days
    val verificationAttempts: Int = 0,
    val reverificationNeeded: Boolean = false
)

// Comprehensive Business Verification Composite
data class BusinessVerification(
    val level: VerificationLevel = VerificationLevel.UNVERIFIED,
    val mobile: MobileVerificationRecord = MobileVerificationRecord(),
    val location: LocationVerificationRecord = LocationVerificationRecord(),
    val businessDoc: BusinessVerificationRecord = BusinessVerificationRecord(),
    val schedule: ReverificationSchedule = ReverificationSchedule()
) {
    val isMobileVerified: Boolean get() = mobile.status == VerificationStatus.VERIFIED
    val isLocationVerified: Boolean get() = location.status == VerificationStatus.VERIFIED
    val isBusinessDocVerified: Boolean get() = businessDoc.status == VerificationStatus.VERIFIED
    val needsReverification: Boolean get() = schedule.reverificationNeeded || System.currentTimeMillis() > schedule.nextVerificationAt
}

// User Entity bound to Firebase UID
data class UserProfile(
    val uid: String,
    val mobile: String,
    val name: String,
    val email: String? = null,
    val profilePhotoUrl: String = "",
    val accountType: String = "business", // "consumer" or "business"
    val businessId: String? = null,
    val mobileVerified: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val lastLoginAt: Long = System.currentTimeMillis(),
    val authProvider: String = "google"
)

data class Business(
    val id: String,
    val ownerUid: String = "",
    val name: String,
    val category: String,
    val subcategory: String,
    val businessType: BusinessType,
    val description: String,
    val phone: String,
    val address: String,
    val city: String = "Rajkot",
    val lat: Double,
    val lng: Double,
    val logoUrl: String,
    val coverImageUrl: String,
    val rating: Float = 5.0f,
    val reviewCount: Int = 0,
    val openForChat: Boolean = true,
    val hours: String = "Mon-Sat · 09:00 - 20:00",
    val verification: BusinessVerification = BusinessVerification(),
    val isSponsored: Boolean = false
)

data class Product(
    val id: String,
    val businessId: String,
    val businessName: String,
    val name: String,
    val description: String,
    val price: Double,
    val priceOnRequest: Boolean = false,
    val imageUrl: String,
    val available: Boolean = true,
    val location: String = "Rajkot"
)

data class ServiceItem(
    val id: String,
    val businessId: String,
    val businessName: String,
    val name: String,
    val description: String,
    val startingPrice: Double,
    val serviceArea: String = "Rajkot",
    val available: Boolean = true
)

enum class MessageType {
    TEXT, IMAGE, AUDIO, LOCATION, PRODUCT_CARD, QUOTATION
}

enum class QuotationStatus {
    SENT, ACCEPTED, REJECTED, NEGOTIATING, EXPIRED
}

data class QuotationData(
    val quotationNumber: String,
    val itemName: String,
    val quantity: Int,
    val unitPrice: Double,
    val gstRatePct: Int,
    val totalAmount: Double,
    val status: QuotationStatus = QuotationStatus.SENT,
    val terms: String = "Valid for 7 days. 100% payment on delivery."
)

data class ChatMessage(
    val id: String,
    val conversationId: String = "",
    val senderId: String,
    val senderName: String,
    val text: String,
    val type: MessageType = MessageType.TEXT,
    val timestamp: Long = System.currentTimeMillis(),
    val formattedTime: String = "Just now",
    val isFromMe: Boolean = false,
    val quotation: QuotationData? = null
)

data class ConversationItem(
    val id: String,
    val participantId: String,
    val name: String,
    val avatarUrl: String,
    val lastMessageText: String,
    val timestamp: String,
    val unreadCount: Int = 0,
    val isBusiness: Boolean = false,
    val verification: BusinessVerification? = null,
    val openForChat: Boolean = true
)

enum class InquiryStatus {
    NEW, CONTACTED, QUOTATION_SENT, CONVERTED, CLOSED
}

data class BusinessInquiry(
    val id: String,
    val businessId: String,
    val customerUid: String = "",
    val customerName: String,
    val customerPhone: String = "",
    val entityTitle: String,
    val note: String,
    val status: InquiryStatus = InquiryStatus.NEW,
    val createdAt: Long = System.currentTimeMillis()
)
