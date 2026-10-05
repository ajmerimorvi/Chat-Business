package in.sampark.app.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import in.sampark.app.domain.UniversalSearchEngine
import in.sampark.app.models.*
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

data class SearchResults(
    val chatsAndContacts: List<ConversationItem> = emptyList(),
    val businesses: List<Business> = emptyList(),
    val products: List<Product> = emptyList(),
    val services: List<ServiceItem> = emptyList()
)

class SamparkRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val searchRanker: UniversalSearchEngine = UniversalSearchEngine()
) {

    // Initial curated verified business network
    private val _businesses = MutableStateFlow<List<Business>>(initialBusinesses)
    val businesses: StateFlow<List<Business>> = _businesses.asStateFlow()

    private val _conversations = MutableStateFlow<List<ConversationItem>>(initialConversations)
    val conversations: StateFlow<List<ConversationItem>> = _conversations.asStateFlow()

    private val _inquiries = MutableStateFlow<List<BusinessInquiry>>(initialInquiries)
    val inquiries: StateFlow<List<BusinessInquiry>> = _inquiries.asStateFlow()

    val products: List<Product> = initialProducts
    val services: List<ServiceItem> = initialServices

    init {
        // Sync businesses from Firestore
        syncBusinessesFromFirestore()
    }

    private fun syncBusinessesFromFirestore() {
        try {
            firestore.collection("businesses")
                .addSnapshotListener { snapshot, error ->
                    if (error != null || snapshot == null || snapshot.isEmpty) {
                        return@addSnapshotListener
                    }
                    val remoteBusinesses = snapshot.documents.mapNotNull { doc ->
                        try {
                            Business(
                                id = doc.id,
                                ownerUid = doc.getString("ownerUid") ?: "",
                                name = doc.getString("name") ?: "",
                                category = doc.getString("category") ?: "",
                                subcategory = doc.getString("subcategory") ?: "",
                                businessType = BusinessType.valueOf(doc.getString("businessType") ?: "PHYSICAL_STORE"),
                                description = doc.getString("description") ?: "",
                                phone = doc.getString("phone") ?: "",
                                address = doc.getString("address") ?: "",
                                city = doc.getString("city") ?: "Rajkot",
                                lat = doc.getDouble("lat") ?: 22.3,
                                lng = doc.getDouble("lng") ?: 70.8,
                                logoUrl = doc.getString("logoUrl") ?: "",
                                coverImageUrl = doc.getString("coverImageUrl") ?: "",
                                rating = (doc.getDouble("rating") ?: 4.8).toFloat(),
                                reviewCount = (doc.getLong("reviewCount") ?: 0).toInt(),
                                openForChat = doc.getBoolean("openForChat") ?: true
                            )
                        } catch (e: Exception) {
                            null
                        }
                    }
                    if (remoteBusinesses.isNotEmpty()) {
                        _businesses.value = remoteBusinesses
                    }
                }
        } catch (e: Exception) {
            // Offline fallback preserved
        }
    }

    /**
     * Real-time listener for conversation messages from Firestore
     */
    fun observeMessages(conversationId: String): Flow<List<ChatMessage>> = callbackFlow {
        try {
            val listener = firestore.collection("conversations")
                .document(conversationId)
                .collection("messages")
                .orderBy("timestamp", Query.Direction.ASCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null || snapshot == null) {
                        return@addSnapshotListener
                    }
                    val messages = snapshot.documents.mapNotNull { doc ->
                        try {
                            ChatMessage(
                                id = doc.id,
                                conversationId = conversationId,
                                senderId = doc.getString("senderId") ?: "",
                                senderName = doc.getString("senderName") ?: "",
                                text = doc.getString("text") ?: "",
                                type = MessageType.valueOf(doc.getString("type") ?: "TEXT"),
                                timestamp = doc.getLong("timestamp") ?: System.currentTimeMillis(),
                                formattedTime = doc.getString("formattedTime") ?: "Just now"
                            )
                        } catch (e: Exception) {
                            null
                        }
                    }
                    trySend(messages)
                }
            awaitClose { listener.remove() }
        } catch (e: Exception) {
            // Emits initial empty or local list if Firebase offline
            trySend(emptyList())
            awaitClose {}
        }
    }

    /**
     * Real-time listener for inquiries
     */
    fun observeInquiries(businessId: String): Flow<List<BusinessInquiry>> = callbackFlow {
        try {
            val listener = firestore.collection("inquiries")
                .whereEqualTo("businessId", businessId)
                .addSnapshotListener { snapshot, error ->
                    if (error != null || snapshot == null) return@addSnapshotListener
                    val list = snapshot.documents.mapNotNull { doc ->
                        try {
                            BusinessInquiry(
                                id = doc.id,
                                businessId = doc.getString("businessId") ?: "",
                                customerUid = doc.getString("customerUid") ?: "",
                                customerName = doc.getString("customerName") ?: "",
                                customerPhone = doc.getString("customerPhone") ?: "",
                                entityTitle = doc.getString("entityTitle") ?: "",
                                note = doc.getString("note") ?: "",
                                status = InquiryStatus.valueOf(doc.getString("status") ?: "NEW"),
                                createdAt = doc.getLong("createdAt") ?: System.currentTimeMillis()
                            )
                        } catch (e: Exception) {
                            null
                        }
                    }
                    trySend(list)
                }
            awaitClose { listener.remove() }
        } catch (e: Exception) {
            trySend(_inquiries.value)
            awaitClose {}
        }
    }

    suspend fun sendMessage(
        conversationId: String,
        senderUid: String,
        senderName: String,
        text: String,
        quotation: QuotationData? = null
    ) {
        val msgType = if (quotation != null) MessageType.QUOTATION else MessageType.TEXT
        val messageMap = hashMapOf(
            "senderId" to senderUid,
            "senderName" to senderName,
            "text" to text,
            "type" to msgType.name,
            "timestamp" to System.currentTimeMillis(),
            "formattedTime" to "Just now"
        )

        try {
            firestore.collection("conversations")
                .document(conversationId)
                .collection("messages")
                .add(messageMap)
                .await()

            firestore.collection("conversations")
                .document(conversationId)
                .update(
                    mapOf(
                        "lastMessageText" to text,
                        "timestamp" to "Just now"
                    )
                )
        } catch (e: Exception) {
            // Local state update fallback
            val updated = _conversations.value.map { conv ->
                if (conv.id == conversationId) {
                    conv.copy(lastMessageText = text, timestamp = "Just now")
                } else conv
            }
            _conversations.value = updated
        }
    }

    suspend fun createInquiry(inquiry: BusinessInquiry) {
        try {
            val map = hashMapOf(
                "businessId" to inquiry.businessId,
                "customerUid" to inquiry.customerUid,
                "customerName" to inquiry.customerName,
                "customerPhone" to inquiry.customerPhone,
                "entityTitle" to inquiry.entityTitle,
                "note" to inquiry.note,
                "status" to inquiry.status.name,
                "createdAt" to inquiry.createdAt
            )
            firestore.collection("inquiries").add(map).await()
        } catch (e: Exception) {
            _inquiries.value = _inquiries.value + inquiry
        }
    }

    suspend fun updateInquiryStatus(inquiryId: String, status: InquiryStatus) {
        try {
            firestore.collection("inquiries").document(inquiryId).update("status", status.name).await()
        } catch (e: Exception) {
            _inquiries.value = _inquiries.value.map {
                if (it.id == inquiryId) it.copy(status = status) else it
            }
        }
    }

    suspend fun updateLocationVerification(
        businessId: String,
        lat: Double,
        lng: Double,
        accuracyMeters: Float,
        address: String
    ) {
        val verificationData = mapOf(
            "lat" to lat,
            "lng" to lng,
            "verification.location.status" to VerificationStatus.VERIFIED.name,
            "verification.location.latitude" to lat,
            "verification.location.longitude" to lng,
            "verification.location.accuracyMeters" to accuracyMeters,
            "verification.location.verifiedAddress" to address,
            "verification.location.verifiedAt" to System.currentTimeMillis(),
            "verification.level" to VerificationLevel.LOCATION_VERIFIED.name
        )
        try {
            firestore.collection("businesses").document(businessId).update(verificationData).await()
        } catch (e: Exception) {
            // Local update fallback
            _businesses.value = _businesses.value.map { biz ->
                if (biz.id == businessId) {
                    biz.copy(
                        lat = lat,
                        lng = lng,
                        verification = biz.verification.copy(
                            level = VerificationLevel.LOCATION_VERIFIED,
                            location = LocationVerificationRecord(
                                status = VerificationStatus.VERIFIED,
                                latitude = lat,
                                longitude = lng,
                                accuracyMeters = accuracyMeters,
                                verifiedAddress = address,
                                verifiedAt = System.currentTimeMillis()
                            )
                        )
                    )
                } else biz
            }
        }
    }

    suspend fun updateBusinessDocVerification(
        businessId: String,
        docType: DocumentType,
        docNumber: String
    ) {
        val verificationData = mapOf(
            "verification.businessDoc.status" to VerificationStatus.VERIFIED.name,
            "verification.businessDoc.documentType" to docType.name,
            "verification.businessDoc.documentNumber" to docNumber,
            "verification.businessDoc.verifiedAt" to System.currentTimeMillis(),
            "verification.level" to VerificationLevel.BUSINESS_VERIFIED.name
        )
        try {
            firestore.collection("businesses").document(businessId).update(verificationData).await()
        } catch (e: Exception) {
            _businesses.value = _businesses.value.map { biz ->
                if (biz.id == businessId) {
                    biz.copy(
                        verification = biz.verification.copy(
                            level = VerificationLevel.BUSINESS_VERIFIED,
                            businessDoc = BusinessVerificationRecord(
                                status = VerificationStatus.VERIFIED,
                                documentType = docType,
                                documentNumber = docNumber,
                                verifiedAt = System.currentTimeMillis()
                            )
                        )
                    )
                } else biz
            }
        }
    }

    /**
     * Unified Universal Search powered by UniversalSearchEngine
     */
    fun searchUniversal(
        query: String,
        verifiedOnly: Boolean = false,
        userLat: Double? = null,
        userLng: Double? = null
    ): SearchResults {
        val q = query.trim()
        if (q.isEmpty()) return SearchResults()

        // 1. Rank chats & contacts
        val scoredChats = _conversations.value.mapNotNull { conv ->
            val score = searchRanker.calculateScore(
                query = q,
                primaryText = conv.name,
                secondaryText = conv.lastMessageText,
                isContact = true,
                verificationLevel = conv.verification?.level ?: VerificationLevel.UNVERIFIED
            )
            if (score > 0) conv to score else null
        }.sortedByDescending { it.second }.map { it.first }

        // 2. Rank businesses with proximity and verification bonus
        val scoredBusinesses = _businesses.value.mapNotNull { biz ->
            if (verifiedOnly && biz.verification.level == VerificationLevel.UNVERIFIED) {
                return@mapNotNull null
            }
            val score = searchRanker.calculateScore(
                query = q,
                primaryText = biz.name,
                secondaryText = "${biz.category} ${biz.subcategory} ${biz.description} ${biz.address}",
                isContact = false,
                verificationLevel = biz.verification.level,
                userLat = userLat,
                userLng = userLng,
                entityLat = biz.lat,
                entityLng = biz.lng
            )
            if (score > 0) biz to score else null
        }.sortedByDescending { it.second }.map { it.first }

        // 3. Rank products
        val scoredProducts = products.mapNotNull { prod ->
            val score = searchRanker.calculateScore(
                query = q,
                primaryText = prod.name,
                secondaryText = "${prod.businessName} ${prod.description}",
                isContact = false
            )
            if (score > 0) prod to score else null
        }.sortedByDescending { it.second }.map { it.first }

        // 4. Rank services
        val scoredServices = services.mapNotNull { srv ->
            val score = searchRanker.calculateScore(
                query = q,
                primaryText = srv.name,
                secondaryText = "${srv.businessName} ${srv.description} ${srv.serviceArea}",
                isContact = false
            )
            if (score > 0) srv to score else null
        }.sortedByDescending { it.second }.map { it.first }

        return SearchResults(
            chatsAndContacts = scoredChats,
            businesses = scoredBusinesses,
            products = scoredProducts,
            services = scoredServices
        )
    }

    companion object {
        val initialConversations = listOf(
            ConversationItem(
                id = "conv_raj_patel",
                participantId = "cnt_raj_patel",
                name = "Raj Patel",
                avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                lastMessageText = "Send me the quotation for 5 modular desks",
                timestamp = "10:42 AM",
                unreadCount = 1,
                isBusiness = false
            ),
            ConversationItem(
                id = "conv_abc_furn",
                participantId = "biz_abc_furn",
                name = "ABC Furniture",
                avatarUrl = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200",
                lastMessageText = "Your quotation QT-8821 has been issued",
                timestamp = "09:15 AM",
                unreadCount = 0,
                isBusiness = true,
                verification = BusinessVerification(
                    level = VerificationLevel.LOCATION_VERIFIED,
                    mobile = MobileVerificationRecord(status = VerificationStatus.VERIFIED, phoneNumber = "+91 98250 88990"),
                    location = LocationVerificationRecord(
                        status = VerificationStatus.VERIFIED,
                        latitude = 22.2856,
                        longitude = 70.7932,
                        accuracyMeters = 8.5f,
                        verifiedAddress = "Plot 42, Gondal Road, Rajkot"
                    )
                ),
                openForChat = true
            ),
            ConversationItem(
                id = "conv_synnera",
                participantId = "biz_synnera",
                name = "Synnera Mattress",
                avatarUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200",
                lastMessageText = "Yes, we customize sizes in 48 hours",
                timestamp = "Yesterday",
                isBusiness = true,
                verification = BusinessVerification(
                    level = VerificationLevel.BUSINESS_VERIFIED,
                    mobile = MobileVerificationRecord(status = VerificationStatus.VERIFIED, phoneNumber = "+91 98254 11223"),
                    location = LocationVerificationRecord(
                        status = VerificationStatus.VERIFIED,
                        latitude = 22.3012,
                        longitude = 70.7812,
                        accuracyMeters = 6.0f,
                        verifiedAddress = "150 Feet Ring Road, Near Indira Circle, Rajkot"
                    ),
                    businessDoc = BusinessVerificationRecord(
                        status = VerificationStatus.VERIFIED,
                        documentType = DocumentType.GSTIN,
                        documentNumber = "24AAACS1234D1Z5"
                    )
                ),
                openForChat = true
            )
        )

        val initialBusinesses = listOf(
            Business(
                id = "biz_abc_furn",
                ownerUid = "owner_abc_furn",
                name = "ABC Furniture",
                category = "Furniture Store",
                subcategory = "Home & Office",
                businessType = BusinessType.PHYSICAL_STORE,
                description = "Customized wooden sofas, solid teak dining tables, and modular storage beds.",
                phone = "+91 98250 88990",
                address = "Plot 42, Gondal Road",
                city = "Rajkot",
                lat = 22.2856,
                lng = 70.7932,
                logoUrl = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=200",
                coverImageUrl = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
                rating = 4.7f,
                reviewCount = 128,
                openForChat = true,
                verification = BusinessVerification(
                    level = VerificationLevel.LOCATION_VERIFIED,
                    mobile = MobileVerificationRecord(status = VerificationStatus.VERIFIED, phoneNumber = "+91 98250 88990"),
                    location = LocationVerificationRecord(
                        status = VerificationStatus.VERIFIED,
                        latitude = 22.2856,
                        longitude = 70.7932,
                        accuracyMeters = 8.5f,
                        verifiedAddress = "Gondal Road, Rajkot"
                    )
                )
            ),
            Business(
                id = "biz_raj_hard",
                ownerUid = "owner_raj_hard",
                name = "Raj Hardware",
                category = "Hardware Store",
                subcategory = "Power Tools & Fasteners",
                businessType = BusinessType.PHYSICAL_STORE,
                description = "Wholesale power tools, architectural handles, brass locks, and hinges.",
                phone = "+91 98251 77334",
                address = "Shop 12, Dhebar Road Market",
                city = "Rajkot",
                lat = 22.2980,
                lng = 70.8010,
                logoUrl = "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200",
                coverImageUrl = "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800",
                rating = 4.8f,
                reviewCount = 92,
                openForChat = true,
                verification = BusinessVerification(
                    level = VerificationLevel.BUSINESS_VERIFIED,
                    mobile = MobileVerificationRecord(status = VerificationStatus.VERIFIED, phoneNumber = "+91 98251 77334"),
                    location = LocationVerificationRecord(
                        status = VerificationStatus.VERIFIED,
                        latitude = 22.2980,
                        longitude = 70.8010,
                        accuracyMeters = 5.2f,
                        verifiedAddress = "Dhebar Road, Rajkot"
                    ),
                    businessDoc = BusinessVerificationRecord(
                        status = VerificationStatus.VERIFIED,
                        documentType = DocumentType.GSTIN,
                        documentNumber = "24AADCR9921M1Z1"
                    )
                )
            ),
            Business(
                id = "biz_synnera",
                ownerUid = "owner_synnera",
                name = "Synnera Mattress",
                category = "Mattress & Bedding",
                subcategory = "Orthopedic Sleep",
                businessType = BusinessType.PHYSICAL_STORE,
                description = "Pocket spring and orthopedic memory foam mattresses made to custom size.",
                phone = "+91 98254 11223",
                address = "150 Feet Ring Road, Near Indira Circle",
                city = "Rajkot",
                lat = 22.3012,
                lng = 70.7812,
                logoUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200",
                coverImageUrl = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
                rating = 4.9f,
                reviewCount = 164,
                openForChat = true,
                verification = BusinessVerification(
                    level = VerificationLevel.BUSINESS_VERIFIED,
                    mobile = MobileVerificationRecord(status = VerificationStatus.VERIFIED, phoneNumber = "+91 98254 11223"),
                    location = LocationVerificationRecord(
                        status = VerificationStatus.VERIFIED,
                        latitude = 22.3012,
                        longitude = 70.7812,
                        accuracyMeters = 6.0f,
                        verifiedAddress = "150 Feet Ring Road, Rajkot"
                    ),
                    businessDoc = BusinessVerificationRecord(
                        status = VerificationStatus.VERIFIED,
                        documentType = DocumentType.UDYAM_MSME,
                        documentNumber = "UDYAM-GJ-20-0019284"
                    )
                )
            )
        )

        val initialProducts = listOf(
            Product(
                id = "prod_pocket_mattress",
                businessId = "biz_synnera",
                businessName = "Synnera Mattress",
                name = "Pocket Spring Mattress (72x78)",
                description = "Zero motion transfer with high resilience Euro-top padding.",
                price = 12500.0,
                imageUrl = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600"
            ),
            Product(
                id = "prod_sofa_3seater",
                businessId = "biz_abc_furn",
                businessName = "ABC Furniture",
                name = "3-Seater Chesterfield Fabric Sofa",
                description = "Hand-tufted suede fabric with treated teak frame.",
                price = 24500.0,
                imageUrl = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600"
            ),
            Product(
                id = "prod_tools_drill",
                businessId = "biz_raj_hard",
                businessName = "Raj Hardware",
                name = "Hardware Tools & Rotary Drill Kit",
                description = "850W rotary hammer drill with 26-piece masonry bit set.",
                price = 4850.0,
                imageUrl = "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600"
            )
        )

        val initialServices = listOf(
            ServiceItem(
                id = "srv_ac_repair",
                businessId = "biz_abc_ac_service",
                businessName = "ABC Services",
                name = "AC Repair & Jet Servicing",
                description = "Doorstep high pressure jet cleaning and gas check.",
                startingPrice = 500.0,
                serviceArea = "Rajkot City"
            ),
            ServiceItem(
                id = "srv_custom_furniture",
                businessId = "biz_abc_furn",
                businessName = "ABC Furniture",
                name = "Custom Furniture Making",
                description = "Bespoke carpentry and modular room designing.",
                startingPrice = 5000.0,
                serviceArea = "Rajkot"
            )
        )

        val initialInquiries = listOf(
            BusinessInquiry(
                id = "inq_01",
                businessId = "biz_abc_furn",
                customerName = "Raj Patel",
                customerPhone = "+91 98250 11223",
                entityTitle = "Chesterfield Fabric Sofa",
                note = "Need customization with royal blue suede fabric and teak legs.",
                status = InquiryStatus.NEW
            ),
            BusinessInquiry(
                id = "inq_02",
                businessId = "biz_synnera",
                customerName = "Priya Mehta",
                customerPhone = "+91 98255 44332",
                entityTitle = "Custom Size Mattress (75x60)",
                note = "Looking for orthopedic dual firmness for elderly parents.",
                status = InquiryStatus.QUOTATION_SENT
            )
        )
    }
}
