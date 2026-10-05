package in.sampark.app.domain

import in.sampark.app.models.Business
import in.sampark.app.models.ConversationItem
import in.sampark.app.models.Product
import in.sampark.app.models.ServiceItem
import in.sampark.app.models.VerificationLevel
import kotlin.math.*

enum class EntityType {
    CONTACT, RECENT_CHAT, BUSINESS, PRODUCT, SERVICE
}

data class RankedSearchResult<T>(
    val item: T,
    val score: Float,
    val type: EntityType
)

/**
 * Universal Search & Multi-Attribute Weighted Ranker
 *
 * Ranking Algorithm:
 * - Query Exact Match: +100
 * - Starts With Query: +80
 * - Query Contained in Title: +40
 * - Query Contained in Subtitle / Category / Description: +20
 * - Established Contact Affinity: +25
 * - Verification Tier Bonus:
 *     * Business Verified (Level 3): +30
 *     * Location Verified (Level 2): +20
 *     * Mobile Verified (Level 1): +10
 * - Proximity Distance Multiplier: Up to +25 for nearby physical stores (< 5 km)
 */
class UniversalSearchEngine {

    fun calculateScore(
        query: String,
        primaryText: String,
        secondaryText: String = "",
        isContact: Boolean = false,
        verificationLevel: VerificationLevel = VerificationLevel.UNVERIFIED,
        userLat: Double? = null,
        userLng: Double? = null,
        entityLat: Double? = null,
        entityLng: Double? = null
    ): Float {
        val q = query.trim().lowercase()
        val p = primaryText.trim().lowercase()
        val s = secondaryText.trim().lowercase()

        if (q.isEmpty()) return 0f

        var score = 0f

        // 1. Text match scoring
        when {
            p == q -> score += 100f
            p.startsWith(q) -> score += 80f
            p.contains(q) -> score += 40f
            s.contains(q) -> score += 20f
        }

        // 2. Relationship affinity bonus
        if (isContact) score += 25f

        // 3. Verification authenticity weighting
        score += when (verificationLevel) {
            VerificationLevel.BUSINESS_VERIFIED -> 30f
            VerificationLevel.LOCATION_VERIFIED -> 20f
            VerificationLevel.MOBILE_VERIFIED -> 10f
            VerificationLevel.UNVERIFIED -> 0f
        }

        // 4. Geospatial proximity weighting (Haversine distance)
        if (userLat != null && userLng != null && entityLat != null && entityLng != null) {
            val distanceKm = calculateDistanceKm(userLat, userLng, entityLat, entityLng)
            if (distanceKm <= 2.0) {
                score += 25f // Within walking distance
            } else if (distanceKm <= 5.0) {
                score += 15f // Within local neighborhood
            } else if (distanceKm <= 15.0) {
                score += 5f  // Within city limits
            }
        }

        return score
    }

    private fun calculateDistanceKm(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371.0 // Radius of earth in km
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }
}
