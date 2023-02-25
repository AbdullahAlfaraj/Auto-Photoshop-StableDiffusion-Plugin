samplers = [
    {
        name: 'Euler a',
        aliases: ['k_euler_a', 'k_euler_ancestral'],
        options: {},
    },
    {
        name: 'Euler',
        aliases: ['k_euler'],
        options: {},
    },
    {
        name: 'LMS',
        aliases: ['k_lms'],
        options: {},
    },
    {
        name: 'Heun',
        aliases: ['k_heun'],
        options: {},
    },
    {
        name: 'DPM2',
        aliases: ['k_dpm_2'],
        options: {
            discard_next_to_last_sigma: 'True',
        },
    },
    {
        name: 'DPM2 a',
        aliases: ['k_dpm_2_a'],
        options: {
            discard_next_to_last_sigma: 'True',
        },
    },
    {
        name: 'DPM++ 2S a',
        aliases: ['k_dpmpp_2s_a'],
        options: {},
    },
    {
        name: 'DPM++ 2M',
        aliases: ['k_dpmpp_2m'],
        options: {},
    },
    {
        name: 'DPM++ SDE',
        aliases: ['k_dpmpp_sde'],
        options: {},
    },
    {
        name: 'DPM fast',
        aliases: ['k_dpm_fast'],
        options: {},
    },
    {
        name: 'DPM adaptive',
        aliases: ['k_dpm_ad'],
        options: {},
    },
    {
        name: 'LMS Karras',
        aliases: ['k_lms_ka'],
        options: {
            scheduler: 'karras',
        },
    },
    {
        name: 'DPM2 Karras',
        aliases: ['k_dpm_2_ka'],
        options: {
            scheduler: 'karras',
            discard_next_to_last_sigma: 'True',
        },
    },
    {
        name: 'DPM2 a Karras',
        aliases: ['k_dpm_2_a_ka'],
        options: {
            scheduler: 'karras',
            discard_next_to_last_sigma: 'True',
        },
    },
    {
        name: 'DPM++ 2S a Karras',
        aliases: ['k_dpmpp_2s_a_ka'],
        options: {
            scheduler: 'karras',
        },
    },
    {
        name: 'DPM++ 2M Karras',
        aliases: ['k_dpmpp_2m_ka'],
        options: {
            scheduler: 'karras',
        },
    },
    {
        name: 'DPM++ SDE Karras',
        aliases: ['k_dpmpp_sde_ka'],
        options: {
            scheduler: 'karras',
        },
    },
    {
        name: 'DDIM',
        aliases: [],
        options: {},
    },
    {
        name: 'PLMS',
        aliases: [],
        options: {},
    },
]

module.exports = { samplers }
