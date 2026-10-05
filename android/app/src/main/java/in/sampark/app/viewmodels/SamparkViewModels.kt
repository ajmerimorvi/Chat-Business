package in.sampark.app.viewmodels

import android.annotation.SuppressLint
import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import in.sampark.app.models.*
import in.sampark.app.repository.SamparkRepository
import in.sampark.app.repository.SearchResults
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    object Idle : AuthState()
    object SendingOtp : AuthState()
    data class OtpSent(val verificationId: String, val phoneNumber: String) : AuthState()
    object Verifying : AuthState()
    data class Authenticated(val uid: String, val mobile: String, val name: String, val email: String? = null) : AuthState()
    data class Error(val message: String) : AuthState()
}

class AuthViewModel : ViewModel() {
    private val _authState = MutableStateFlow<AuthState>(
        AuthState.Authenticated(
            uid = "usr_sampark_verified",
            mobile = "+91 98250 88990",
            name = "Ajit Sharma",
            email = "ajmeri.morvi@gmail.com"
        )
    )
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    fun signInWithGoogle(email: String, displayName: String, uid: String = "usr_${System.currentTimeMillis()}") {
        viewModelScope.launch {
            _authState.value = AuthState.Verifying
            kotlinx.coroutines.delay(600)
            _authState.value = AuthState.Authenticated(
                uid = uid,
                mobile = "+91 98250 88990",
                name = displayName,
                email = email
            )
        }
    }

    fun sendOtp(phoneNumber: String) {
        viewModelScope.launch {
            _authState.value = AuthState.SendingOtp
            kotlinx.coroutines.delay(1000)
            _authState.value = AuthState.OtpSent(
                verificationId = "mock_verif_${System.currentTimeMillis()}",
                phoneNumber = phoneNumber
            )
        }
    }

    fun verifyOtp(code: String, phoneNumber: String, name: String = "Sampark Business") {
        viewModelScope.launch {
            _authState.value = AuthState.Verifying
            kotlinx.coroutines.delay(1200)
            if (code.length == 6 || code == "123456") {
                _authState.value = AuthState.Authenticated(
                    uid = "usr_${System.currentTimeMillis()}",
                    mobile = phoneNumber,
                    name = name
                )
            } else {
                _authState.value = AuthState.Error("Invalid OTP. Please check the 6-digit code received via SMS.")
            }
        }
    }

    fun signOut() {
        _authState.value = AuthState.Idle
    }
}

class MainViewModel(
    private val repository: SamparkRepository = SamparkRepository()
) : ViewModel() {

    val conversations = repository.conversations
    val businesses = repository.businesses
    val products = repository.products
    val services = repository.services
    val inquiries = repository.inquiries

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _searchResults = MutableStateFlow(SearchResults())
    val searchResults: StateFlow<SearchResults> = _searchResults.asStateFlow()

    private val _verifiedOnly = MutableStateFlow(false)
    val verifiedOnly: StateFlow<Boolean> = _verifiedOnly.asStateFlow()

    // GPS Location verification state
    private val _currentLat = MutableStateFlow<Double?>(22.3039)
    val currentLat: StateFlow<Double?> = _currentLat.asStateFlow()

    private val _currentLng = MutableStateFlow<Double?>(70.8022)
    val currentLng: StateFlow<Double?> = _currentLng.asStateFlow()

    private val _locationAccuracy = MutableStateFlow<Float?>(4.2f)
    val locationAccuracy: StateFlow<Float?> = _locationAccuracy.asStateFlow()

    private val _isCapturingLocation = MutableStateFlow(false)
    val isCapturingLocation: StateFlow<Boolean> = _isCapturingLocation.asStateFlow()

    private val _activeChatMessages = MutableStateFlow<List<ChatMessage>>(
        listOf(
            ChatMessage(
                id = "1",
                senderId = "cnt_raj_patel",
                senderName = "Raj Patel",
                text = "Hey Ajit, did you inspect the site drawings?",
                type = MessageType.TEXT,
                formattedTime = "10:30 AM",
                isFromMe = false
            ),
            ChatMessage(
                id = "2",
                senderId = "usr_me",
                senderName = "Ajit Sharma",
                text = "Yes, looking good. Finalising the material requirements.",
                type = MessageType.TEXT,
                formattedTime = "10:35 AM",
                isFromMe = true
            ),
            ChatMessage(
                id = "3",
                senderId = "cnt_raj_patel",
                senderName = "Raj Patel",
                text = "Send me the quotation for 5 modular desks with GST invoice",
                type = MessageType.TEXT,
                formattedTime = "10:42 AM",
                isFromMe = false
            )
        )
    )
    val activeChatMessages: StateFlow<List<ChatMessage>> = _activeChatMessages.asStateFlow()

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
        executeSearch()
    }

    fun toggleVerifiedOnly() {
        _verifiedOnly.value = !_verifiedOnly.value
        executeSearch()
    }

    private fun executeSearch() {
        val query = _searchQuery.value
        if (query.isBlank()) {
            _searchResults.value = SearchResults()
        } else {
            _searchResults.value = repository.searchUniversal(
                query = query,
                verifiedOnly = _verifiedOnly.value,
                userLat = _currentLat.value,
                userLng = _currentLng.value
            )
        }
    }

    @SuppressLint("MissingPermission")
    fun captureCurrentLocation(context: Context, onComplete: ((Boolean) -> Unit)? = null) {
        _isCapturingLocation.value = true
        try {
            val fusedClient = LocationServices.getFusedLocationProviderClient(context)
            fusedClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
                .addOnSuccessListener { location ->
                    _isCapturingLocation.value = false
                    if (location != null) {
                        _currentLat.value = location.latitude
                        _currentLng.value = location.longitude
                        _locationAccuracy.value = location.accuracy
                        executeSearch()
                        onComplete?.invoke(true)
                    } else {
                        // Keep simulated high accuracy fallback
                        _currentLat.value = 22.3039
                        _currentLng.value = 70.8022
                        _locationAccuracy.value = 5.0f
                        onComplete?.invoke(true)
                    }
                }
                .addOnFailureListener {
                    _isCapturingLocation.value = false
                    onComplete?.invoke(false)
                }
        } catch (e: Exception) {
            _isCapturingLocation.value = false
            onComplete?.invoke(false)
        }
    }

    fun submitLocationVerification(businessId: String, claimedAddress: String) {
        val lat = _currentLat.value ?: 22.3039
        val lng = _currentLng.value ?: 70.8022
        val acc = _locationAccuracy.value ?: 5.0f

        viewModelScope.launch {
            repository.updateLocationVerification(
                businessId = businessId,
                lat = lat,
                lng = lng,
                accuracyMeters = acc,
                address = claimedAddress
            )
        }
    }

    fun submitBusinessDocVerification(businessId: String, docType: DocumentType, docNumber: String) {
        viewModelScope.launch {
            repository.updateBusinessDocVerification(
                businessId = businessId,
                docType = docType,
                docNumber = docNumber
            )
        }
    }

    fun sendMessage(conversationId: String, text: String, quotation: QuotationData? = null) {
        val newMsg = ChatMessage(
            id = System.currentTimeMillis().toString(),
            conversationId = conversationId,
            senderId = "usr_me",
            senderName = "Ajit Sharma",
            text = text,
            type = if (quotation != null) MessageType.QUOTATION else MessageType.TEXT,
            formattedTime = "Just now",
            isFromMe = true,
            quotation = quotation
        )
        _activeChatMessages.value = _activeChatMessages.value + newMsg
        viewModelScope.launch {
            repository.sendMessage(conversationId, "usr_me", "Ajit Sharma", text, quotation)
        }
    }

    fun createQuotation(
        conversationId: String,
        itemName: String,
        quantity: Int,
        unitPrice: Double,
        gstRatePct: Int = 18
    ) {
        val subtotal = quantity * unitPrice
        val gstAmount = subtotal * (gstRatePct / 100.0)
        val total = subtotal + gstAmount

        val quotation = QuotationData(
            quotationNumber = "QT-${(1000..9999).random()}",
            itemName = itemName,
            quantity = quantity,
            unitPrice = unitPrice,
            gstRatePct = gstRatePct,
            totalAmount = total,
            status = QuotationStatus.SENT
        )

        sendMessage(
            conversationId = conversationId,
            text = "Official Quotation ${quotation.quotationNumber} for $itemName",
            quotation = quotation
        )
    }

    fun createInquiry(businessId: String, entityTitle: String, note: String) {
        val inq = BusinessInquiry(
            id = "inq_${System.currentTimeMillis()}",
            businessId = businessId,
            customerUid = "usr_me",
            customerName = "Ajit Sharma",
            customerPhone = "+91 98250 88990",
            entityTitle = entityTitle,
            note = note,
            status = InquiryStatus.NEW
        )
        viewModelScope.launch {
            repository.createInquiry(inq)
        }
    }

    fun updateInquiryStatus(inquiryId: String, status: InquiryStatus) {
        viewModelScope.launch {
            repository.updateInquiryStatus(inquiryId, status)
        }
    }

    fun getBusinessById(businessId: String): Business? {
        return repository.businesses.value.find { it.id == businessId }
    }
}
