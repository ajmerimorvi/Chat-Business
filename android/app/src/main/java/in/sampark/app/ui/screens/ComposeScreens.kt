package in.sampark.app.ui.screens

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.sampark.app.models.*
import in.sampark.app.repository.SearchResults
import in.sampark.app.ui.components.QuotationCard
import in.sampark.app.ui.components.UniversalSearchBar
import in.sampark.app.ui.components.VerificationBadges
import in.sampark.app.ui.theme.*
import in.sampark.app.viewmodels.MainViewModel

enum class NavigationTab {
    CHATS, DISCOVER, INQUIRIES, VERIFICATION
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScaffold(
    viewModel: MainViewModel,
    onOpenChat: (ConversationItem) -> Unit,
    onOpenBusiness: (String) -> Unit
) {
    var selectedTab by remember { mutableStateOf(NavigationTab.CHATS) }
    val searchQuery by viewModel.searchQuery.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()
    val verifiedOnly by viewModel.verifiedOnly.collectAsState()
    val conversations by viewModel.conversations.collectAsState()
    val businesses by viewModel.businesses.collectAsState()
    val inquiries by viewModel.inquiries.collectAsState()

    Scaffold(
        topBar = {
            Column(modifier = Modifier.background(Emerald800)) {
                TopAppBar(
                    title = {
                        Column {
                            Text("Sampark", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
                            Text("Verified Identity · Location · Business Network", fontSize = 10.sp, color = Emerald50)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Emerald800),
                    actions = {
                        IconButton(onClick = { viewModel.toggleVerifiedOnly() }) {
                            Icon(
                                imageVector = if (verifiedOnly) Icons.Default.Shield else Icons.Default.ShieldMoon,
                                contentDescription = "Verified Filter",
                                tint = if (verifiedOnly) Color(0xFF6EE7B7) else Color.White
                            )
                        }
                    }
                )
                UniversalSearchBar(
                    query = searchQuery,
                    onQueryChange = { viewModel.onSearchQueryChanged(it) },
                    onClear = { viewModel.onSearchQueryChanged("") }
                )
            }
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White, tonalElevation = 8.dp) {
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.CHATS,
                    onClick = { selectedTab = NavigationTab.CHATS },
                    icon = { Icon(Icons.Default.Chat, contentDescription = "Chats") },
                    label = { Text("Chats", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.DISCOVER,
                    onClick = { selectedTab = NavigationTab.DISCOVER },
                    icon = { Icon(Icons.Default.Store, contentDescription = "Discover") },
                    label = { Text("Discover", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.INQUIRIES,
                    onClick = { selectedTab = NavigationTab.INQUIRIES },
                    icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "Inquiries") },
                    label = { Text("CRM Leads", fontSize = 11.sp) }
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.VERIFICATION,
                    onClick = { selectedTab = NavigationTab.VERIFICATION },
                    icon = { Icon(Icons.Default.VerifiedUser, contentDescription = "Verification") },
                    label = { Text("Verify", fontSize = 11.sp) }
                )
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            if (searchQuery.isNotBlank()) {
                SearchResultsScreen(
                    results = searchResults,
                    onConversationClick = onOpenChat,
                    onBusinessClick = onOpenBusiness
                )
            } else {
                when (selectedTab) {
                    NavigationTab.CHATS -> ChatsListScreen(
                        conversations = conversations,
                        onConversationClick = onOpenChat
                    )
                    NavigationTab.DISCOVER -> DiscoverScreen(
                        businesses = businesses,
                        products = viewModel.products,
                        services = viewModel.services,
                        onBusinessClick = onOpenBusiness
                    )
                    NavigationTab.INQUIRIES -> InquiriesScreen(
                        inquiries = inquiries,
                        onStatusChange = { id, status -> viewModel.updateInquiryStatus(id, status) }
                    )
                    NavigationTab.VERIFICATION -> VerificationPortalScreen(viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
fun ChatsListScreen(
    conversations: List<ConversationItem>,
    onConversationClick: (ConversationItem) -> Unit
) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        items(conversations) { conv ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onConversationClick(conv) }
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFE2E8F0)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        conv.name.take(1).uppercase(),
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF334155),
                        fontSize = 18.sp
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(conv.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(conv.timestamp, fontSize = 11.sp, color = Color.Gray)
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        conv.lastMessageText,
                        fontSize = 12.sp,
                        color = Color(0xFF64748B),
                        maxLines = 1
                    )
                    if (conv.verification != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        VerificationBadges(verification = conv.verification)
                    }
                }
                if (conv.unreadCount > 0) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .background(Emerald800, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("${conv.unreadCount}", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Divider(color = Color(0xFFF1F5F9))
        }
    }
}

@Composable
fun DiscoverScreen(
    businesses: List<Business>,
    products: List<Product>,
    services: List<ServiceItem>,
    onBusinessClick: (String) -> Unit
) {
    var selectedSection by remember { mutableStateOf(0) }
    val sections = listOf("Businesses", "Products", "Services")

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedSection, containerColor = Color.White) {
            sections.forEachIndexed { index, title ->
                Tab(
                    selected = selectedSection == index,
                    onClick = { selectedSection = index },
                    text = { Text(title, fontSize = 12.sp, fontWeight = FontWeight.SemiBold) }
                )
            }
        }

        when (selectedSection) {
            0 -> {
                LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(businesses) { biz ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onBusinessClick(biz.id) },
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = CardDefaults.outlinedCardBorder()
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(biz.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(2.dp))
                                        Text("${biz.rating} (${biz.reviewCount})", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                                Text("${biz.category} · ${biz.subcategory}", fontSize = 12.sp, color = Emerald800, fontWeight = FontWeight.Medium)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(biz.description, fontSize = 12.sp, color = Color(0xFF475569), maxLines = 2)
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("📍 ${biz.address}, ${biz.city}", fontSize = 11.sp, color = Color.Gray)
                                Spacer(modifier = Modifier.height(6.dp))
                                VerificationBadges(verification = biz.verification)
                            }
                        }
                    }
                }
            }
            1 -> {
                LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(products) { prod ->
                        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), border = CardDefaults.outlinedCardBorder()) {
                            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(prod.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("By ${prod.businessName}", fontSize = 11.sp, color = Emerald800)
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(prod.description, fontSize = 11.sp, color = Color.Gray, maxLines = 1)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("₹${prod.price.toInt()}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Emerald800)
                                }
                            }
                        }
                    }
                }
            }
            2 -> {
                LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(services) { srv ->
                        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), border = CardDefaults.outlinedCardBorder()) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(srv.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Provided by ${srv.businessName} · ${srv.serviceArea}", fontSize = 11.sp, color = Emerald800)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(srv.description, fontSize = 11.sp, color = Color.Gray)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Starting from ₹${srv.startingPrice.toInt()}", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Emerald800)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun InquiriesScreen(
    inquiries: List<BusinessInquiry>,
    onStatusChange: (String, InquiryStatus) -> Unit
) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Text("Business CRM & Inquiries", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF0F172A))
            Text("Track prospective leads, quotations, and conversions in real-time.", fontSize = 11.sp, color = Color.Gray)
            Spacer(modifier = Modifier.height(4.dp))
        }

        items(inquiries) { inq ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = CardDefaults.outlinedCardBorder()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(inq.customerName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        BadgeTag(
                            text = inq.status.name,
                            bgColor = when (inq.status) {
                                InquiryStatus.NEW -> Color(0xFFDBEAFE)
                                InquiryStatus.CONTACTED -> Color(0xFFFEF3C7)
                                InquiryStatus.QUOTATION_SENT -> Color(0xFFEDE9FE)
                                InquiryStatus.CONVERTED -> Color(0xFFD1FAE5)
                                InquiryStatus.CLOSED -> Color(0xFFF1F5F9)
                            },
                            textColor = when (inq.status) {
                                InquiryStatus.NEW -> Color(0xFF1E40AF)
                                InquiryStatus.CONTACTED -> Color(0xFF92400E)
                                InquiryStatus.QUOTATION_SENT -> Color(0xFF5B21B6)
                                InquiryStatus.CONVERTED -> Color(0xFF065F46)
                                InquiryStatus.CLOSED -> Color(0xFF475569)
                            }
                        )
                    }
                    Text("Regarding: ${inq.entityTitle}", fontSize = 12.sp, color = Emerald800, fontWeight = FontWeight.Medium)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(inq.note, fontSize = 12.sp, color = Color(0xFF334155))
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        OutlinedButton(
                            onClick = { onStatusChange(inq.id, InquiryStatus.CONTACTED) },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text("Contacted", fontSize = 10.sp)
                        }
                        OutlinedButton(
                            onClick = { onStatusChange(inq.id, InquiryStatus.QUOTATION_SENT) },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text("Quote Sent", fontSize = 10.sp)
                        }
                        Button(
                            onClick = { onStatusChange(inq.id, InquiryStatus.CONVERTED) },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald800),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text("Convert", fontSize = 10.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun VerificationPortalScreen(viewModel: MainViewModel) {
    val context = LocalContext.current
    val currentLat by viewModel.currentLat.collectAsState()
    val currentLng by viewModel.currentLng.collectAsState()
    val accuracy by viewModel.locationAccuracy.collectAsState()
    val isCapturing by viewModel.isCapturingLocation.collectAsState()

    var businessAddress by remember { mutableStateOf("Plot 42, Gondal Road, Rajkot") }
    var gstinInput by remember { mutableStateOf("24AAACS1234D1Z5") }
    var locationVerifiedSuccess by remember { mutableStateOf(false) }
    var docVerifiedSuccess by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text("Sampark Verification Center", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF0F172A))
            Text("Authenticate your business identity, physical location, and legal registry.", fontSize = 12.sp, color = Color.Gray)
        }

        // Tier 1: Mobile Identity
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(Color(0xFF86EFAC)))
            ) {
                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.PhoneIphone, contentDescription = null, tint = Color(0xFF16A34A), modifier = Modifier.size(28.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("1. Mobile Identity Verified", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF14532D))
                        Text("+91 98250 88990 (SMS OTP verified)", fontSize = 11.sp, color = Color(0xFF166534))
                    }
                    Icon(Icons.Default.CheckCircle, contentDescription = "Verified", tint = Color(0xFF16A34A))
                }
            }
        }

        // Tier 2: Physical GPS Location Verification
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = CardDefaults.outlinedCardBorder()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.LocationOn, contentDescription = null, tint = Emerald800, modifier = Modifier.size(22.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("2. Physical Location GPS Verification", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                    Text(
                        "Walk into your physical store or office and tap capture. The system cross-references GPS hardware coordinates with claimed business address.",
                        fontSize = 11.sp,
                        color = Color(0xFF475569)
                    )

                    OutlinedTextField(
                        value = businessAddress,
                        onValueChange = { businessAddress = it },
                        label = { Text("Claimed Address") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Coordinates: ${"%.4f".format(currentLat ?: 0.0)}, ${"%.4f".format(currentLng ?: 0.0)}", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            Text("Accuracy Radius: ±${"%.1f".format(accuracy ?: 5f)} meters", fontSize = 11.sp, color = Color(0xFF16A34A), fontWeight = FontWeight.Bold)
                        }
                        Button(
                            onClick = {
                                viewModel.captureCurrentLocation(context) { success ->
                                    if (success) {
                                        viewModel.submitLocationVerification("biz_abc_furn", businessAddress)
                                        locationVerifiedSuccess = true
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald800),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            if (isCapturing) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Text("Capture GPS", fontSize = 11.sp)
                            }
                        }
                    }

                    if (locationVerifiedSuccess) {
                        Text("✅ Physical Location GPS successfully verified & recorded on Firestore!", fontSize = 11.sp, color = Color(0xFF15803D), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Tier 3: Business Document Verification
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = CardDefaults.outlinedCardBorder()
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Business, contentDescription = null, tint = Color(0xFF7E22CE), modifier = Modifier.size(22.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("3. Legal Business Registration", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                    Text("GSTIN / Udyam MSME / Shop & Establishment Act number.", fontSize = 11.sp, color = Color(0xFF475569))

                    OutlinedTextField(
                        value = gstinInput,
                        onValueChange = { gstinInput = it },
                        label = { Text("GSTIN or Udyam Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Button(
                        onClick = {
                            viewModel.submitBusinessDocVerification("biz_abc_furn", DocumentType.GSTIN, gstinInput)
                            docVerifiedSuccess = true
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7E22CE)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Verify Business Registration", fontSize = 12.sp)
                    }

                    if (docVerifiedSuccess) {
                        Text("✅ Legal Document audited & verified for ABC Furniture!", fontSize = 11.sp, color = Color(0xFF7E22CE), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Periodic Re-verification Schedule (60 days)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFBEB)),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(Color(0xFFFDE68A)))
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Schedule, contentDescription = null, tint = Color(0xFFB45309), modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Periodic Re-verification Schedule", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF92400E))
                    }
                    Text("Cycle: 60 Days · Next Re-verification due in 58 days.", fontSize = 11.sp, color = Color(0xFFB45309))
                    Text("Maintains network integrity by preventing outdated or relocated listings.", fontSize = 10.sp, color = Color(0xFF78350F))
                }
            }
        }
    }
}

@Composable
fun SearchResultsScreen(
    results: SearchResults,
    onConversationClick: (ConversationItem) -> Unit,
    onBusinessClick: (String) -> Unit
) {
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        if (results.chatsAndContacts.isNotEmpty()) {
            item { Text("Chats & Contacts", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.Gray) }
            items(results.chatsAndContacts) { conv ->
                Card(modifier = Modifier.fillMaxWidth().clickable { onConversationClick(conv) }, colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(conv.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(conv.lastMessageText, fontSize = 12.sp, color = Color.Gray, maxLines = 1)
                    }
                }
            }
        }

        if (results.businesses.isNotEmpty()) {
            item { Text("Verified Businesses (Ranked by Proximity & Tier)", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Emerald800) }
            items(results.businesses) { biz ->
                Card(modifier = Modifier.fillMaxWidth().clickable { onBusinessClick(biz.id) }, colors = CardDefaults.cardColors(containerColor = Color.White), border = CardDefaults.outlinedCardBorder()) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(biz.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("${biz.category} · 📍 ${biz.address}", fontSize = 11.sp, color = Color.Gray)
                        Spacer(modifier = Modifier.height(4.dp))
                        VerificationBadges(verification = biz.verification)
                    }
                }
            }
        }

        if (results.products.isNotEmpty()) {
            item { Text("Products", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.Gray) }
            items(results.products) { prod ->
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                    Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(prod.name, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.weight(1f))
                        Text("₹${prod.price.toInt()}", fontWeight = FontWeight.Bold, color = Emerald800, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
