<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ReverseGeocodingService
{
    public function reverse(float $latitude, float $longitude): ?string
    {
        try {
            $response = Http::acceptJson()
                ->withHeaders([
                    'User-Agent' => 'GajahMadaRoastery/1.0',
                    'Accept-Language' => 'id',
                ])
                ->timeout(8)
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'format' => 'jsonv2',
                    'lat' => $latitude,
                    'lon' => $longitude,
                    'zoom' => 18,
                    'addressdetails' => 1,
                    'accept-language' => 'id',
                ]);
        } catch (\Throwable) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $address = $response->json('display_name');

        return is_string($address) && filled(trim($address)) ? trim($address) : null;
    }
}
